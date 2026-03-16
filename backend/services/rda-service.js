const { all, get } = require('../db/database');

function normalizeDoc(value) {
  return String(value || '').trim().toUpperCase();
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
    conditions.push('r.rda_type = ?');
    params.push(filters.rdaType);
  }
  if (filters.fromDate) {
    conditions.push('r.attention_date >= ?');
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    conditions.push('r.attention_date <= ?');
    params.push(filters.toDate);
  }

  return all(
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

  const [diagnoses, procedures, medications, observations, documents, timeline] = await Promise.all([
    all(db, 'SELECT code, description FROM diagnoses WHERE record_id = ?', [base.id]),
    all(db, 'SELECT code, description FROM procedures WHERE record_id = ?', [base.id]),
    all(db, 'SELECT name, dosage FROM medications WHERE record_id = ?', [base.id]),
    all(db, 'SELECT note FROM observations WHERE record_id = ?', [base.id]),
    all(db, 'SELECT name, reference FROM attachments WHERE record_id = ?', [base.id]),
    all(db, 'SELECT event_time AS time, event_text AS event FROM timeline_events WHERE record_id = ? ORDER BY id ASC', [base.id])
  ]);

  return {
    ...base,
    diagnoses,
    procedures,
    medications,
    observations,
    documents,
    timeline
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

module.exports = { queryPatient, listPatientRdas, getRdaDetail, getSummary, getDocument };
