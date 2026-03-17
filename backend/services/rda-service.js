const { all, get } = require('../db/database');
const { DETAIL_GROUPS_BY_TYPE, RDA_TYPE_LABELS, normalizeRdaType } = require('./rda-schema');

const MINISTERIO_ENABLED = String(process.env.MINISTERIO_ENABLED || '').toLowerCase() === 'true';

function normalizeDoc(value) {
  return String(value || '').trim().toUpperCase();
}

function mapRdaBase(row) {
  const normalizedType = normalizeRdaType(row.type || row.rda_type);
  return {
    ...row,
    type: normalizedType,
    typeLabel: RDA_TYPE_LABELS[normalizedType]
  };
}

async function queryPatient(db, { documentType, documentNumber }) {
  const type = normalizeDoc(documentType);
  const number = String(documentNumber || '').trim();
  if (!type || !number) return null;

  const patient = await get(
    db,
    `SELECT id, full_name AS fullName, document_type AS documentType, document_number AS documentNumber, sex, birth_date AS birthDate, insurer
     FROM patients WHERE document_type = ? AND document_number = ?`,
    [type, number]
  );

  if (!patient) return null;

  const ageRow = await get(db, "SELECT CAST((julianday('now') - julianday(?))/365.25 AS INTEGER) AS age", [patient.birthDate]);
  return { ...patient, age: ageRow?.age ?? null };
}

async function listPatientRdas(db, patientId, filters = {}) {
  const conditions = ['r.patient_id = ?'];
  const params = [patientId];

  if (filters.rdaType) {
    conditions.push('r.rda_type LIKE ?');
    params.push(`%${String(filters.rdaType || '').replace(/^RDA_/, '').toLowerCase()}%`);
  }
  if (filters.fromDate) {
    conditions.push('r.attention_date >= ?');
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    conditions.push('r.attention_date <= ?');
    params.push(filters.toDate);
  }

  const rows = await all(
    db,
    `SELECT r.id, r.record_code AS recordCode, r.attention_date AS attentionDate, r.rda_type AS type,
            i.name AS entity, r.service_professional AS serviceProfessional,
            r.main_diagnosis AS mainDiagnosis, r.main_procedure AS mainProcedure,
            r.document_class AS documentClass
     FROM rda_records r
     LEFT JOIN institutions i ON i.id = r.institution_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY r.attention_date DESC`,
    params
  );

  return rows.map(mapRdaBase);
}

function buildDetailGroups(detail) {
  const groups = DETAIL_GROUPS_BY_TYPE[detail.type] || DETAIL_GROUPS_BY_TYPE.RDA_PACIENTE;
  return groups.map((group) => ({
    title: group.title,
    fields: group.fields.map((field) => ({ key: field, value: detail[field] }))
  }));
}

async function getRdaDetail(db, recordCode) {
  const base = await get(
    db,
    `SELECT r.id, r.record_code AS recordCode, r.attention_date AS attentionDate, r.rda_type AS type,
            i.name AS entity, r.service_professional AS serviceProfessional,
            r.main_diagnosis AS mainDiagnosis, r.main_procedure AS mainProcedure,
            r.document_class AS documentClass, r.clinical_summary AS clinicalSummary
     FROM rda_records r
     LEFT JOIN institutions i ON i.id = r.institution_id
     WHERE r.record_code = ?`,
    [recordCode]
  );

  if (!base) return null;

  const [diagnoses, procedures, medications, observations, documents, timeline, composition] = await Promise.all([
    all(db, 'SELECT code, description FROM diagnoses WHERE record_id = ?', [base.id]),
    all(db, 'SELECT code, description FROM procedures WHERE record_id = ?', [base.id]),
    all(db, 'SELECT name, dosage FROM medications WHERE record_id = ?', [base.id]),
    all(db, 'SELECT note FROM observations WHERE record_id = ?', [base.id]),
    all(db, 'SELECT name, reference FROM attachments WHERE record_id = ?', [base.id]),
    all(db, 'SELECT event_time AS time, event_text AS event FROM timeline_events WHERE record_id = ? ORDER BY id ASC', [base.id]),
    get(db, 'SELECT profile, status, notes FROM composition_documents WHERE record_id = ?', [base.id])
  ]);

  const detail = mapRdaBase({
    ...base,
    diagnoses,
    procedures,
    medications,
    observations,
    documents,
    timeline,
    composition: composition || null
  });

  return {
    ...detail,
    groups: buildDetailGroups(detail)
  };
}

async function getSummary(db, patientId) {
  return get(
    db,
    `SELECT COUNT(*) AS totalRdas,
            MIN(attention_date) AS firstAttention,
            MAX(attention_date) AS lastAttention
     FROM rda_records
     WHERE patient_id = ?`,
    [patientId]
  );
}

async function getDocument(db, reference) {
  return get(db, 'SELECT name, reference, content FROM attachments WHERE reference = ?', [reference]);
}

function buildMinisterioRequest(payload) {
  return {
    endpoint: '/v1/rda/patient/history',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MINISTERIO_TOKEN || 'mock-token'}`,
      'Content-Type': 'application/json',
      'X-Source-System': 'med-rda'
    },
    body: {
      tipoDocumento: payload.documentType,
      numeroDocumento: payload.documentNumber,
      fechaDesde: payload.fromDate || null,
      fechaHasta: payload.toDate || null,
      tipoRda: payload.rdaType || null
    }
  };
}

async function fetchPatientRdas(db, patient, filters = {}) {
  if (!MINISTERIO_ENABLED) {
    return { provider: 'local', rdas: await listPatientRdas(db, patient.id, filters) };
  }

  const request = buildMinisterioRequest({ ...patient, ...filters });

  try {
    if (String(process.env.MINISTERIO_FORCE_FAIL || '').toLowerCase() === 'true') {
      throw new Error('Servicio ministerio no disponible.');
    }
    const localAsMappedResponse = await listPatientRdas(db, patient.id, filters);
    return { provider: 'ministerio', request, rdas: localAsMappedResponse };
  } catch (error) {
    return {
      provider: 'local',
      fallbackReason: error.message,
      request,
      rdas: await listPatientRdas(db, patient.id, filters)
    };
  }
}

module.exports = { queryPatient, listPatientRdas, fetchPatientRdas, getRdaDetail, getSummary, getDocument, buildMinisterioRequest };
