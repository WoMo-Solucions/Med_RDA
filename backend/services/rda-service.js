const fs = require('fs');
const path = require('path');
const { all, get } = require('../db/database');
const { DETAIL_GROUPS_BY_TYPE, RDA_TYPE_LABELS, normalizeRdaType } = require('./rda-schema');

const MUNICIPALITY_BY_ENTITY = {
  'Clínica Santa Aurora': 'Bogotá',
  'Hospital San Gabriel': 'Medellín',
  'Centro Médico Horizonte': 'Cali',
  'IPS Integrada Norte': 'Barranquilla',
  'Diagnóstico Avanzado IPS': 'Bucaramanga',
  'Fundación CardioVida': 'Cartagena',
  'Unidad Materno Infantil Sol': 'Pereira',
  'Hospital Universitario Central': 'Bogotá'
};

function normalizeDoc(value) {
  return String(value || '').trim().toUpperCase();
}

function mapRdaBase(row) {
  const normalizedType = normalizeRdaType(row.type || row.rda_type);
  const entity = row.entity || '';
  return {
    ...row,
    type: normalizedType,
    typeLabel: RDA_TYPE_LABELS[normalizedType],
    municipio: row.municipio || MUNICIPALITY_BY_ENTITY[entity] || 'No registrado'
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.text || value.display || value.value || '';
}

function getCodingDisplay(value) {
  const coding = safeArray(value?.coding)[0] || {};
  return coding.display || coding.code || getText(value);
}

function readMinisterioSampleBundle() {
  const samplePath = String(process.env.MINISTERIO_SAMPLE_FILE || '').trim();
  if (!samplePath) return null;
  const resolved = path.resolve(process.cwd(), samplePath);
  if (!fs.existsSync(resolved)) return null;
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

function getBundleEntriesByType(bundle, resourceType) {
  return safeArray(bundle?.entry)
    .map((entry) => entry?.resource)
    .filter((resource) => resource?.resourceType === resourceType);
}

function getReferenceId(reference) {
  return String(reference || '').split('/').pop();
}

function buildOrganizationMap(bundle) {
  return Object.fromEntries(
    getBundleEntriesByType(bundle, 'Organization').map((resource) => [resource.id, resource])
  );
}

function buildEncounterMap(bundle) {
  return Object.fromEntries(
    getBundleEntriesByType(bundle, 'Encounter').map((resource) => [resource.id, resource])
  );
}

function buildObservationMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'Observation')) {
    const encounterId = getReferenceId(resource.encounter?.reference);
    if (!encounterId) continue;
    groups[encounterId] = groups[encounterId] || [];
    groups[encounterId].push(resource);
  }
  return groups;
}

function buildMedicationMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'MedicationRequest')) {
    const encounterId = getReferenceId(resource.encounter?.reference);
    if (!encounterId) continue;
    groups[encounterId] = groups[encounterId] || [];
    groups[encounterId].push(resource);
  }
  return groups;
}

function buildProcedureMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'Procedure')) {
    const encounterId = getReferenceId(resource.encounter?.reference);
    if (!encounterId) continue;
    groups[encounterId] = groups[encounterId] || [];
    groups[encounterId].push(resource);
  }
  return groups;
}

function buildConditionMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'Condition')) {
    const encounterId = getReferenceId(resource.encounter?.reference);
    if (!encounterId) continue;
    groups[encounterId] = groups[encounterId] || [];
    groups[encounterId].push(resource);
  }
  return groups;
}

function buildDocumentReferenceMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'DocumentReference')) {
    const encounterId = getReferenceId(resource.context?.encounter?.[0]?.reference || resource.context?.encounter?.reference);
    if (!encounterId) continue;
    groups[encounterId] = groups[encounterId] || [];
    groups[encounterId].push(resource);
  }
  return groups;
}

function extractPatientFromBundle(bundle, fallbackPatient) {
  const patient = getBundleEntriesByType(bundle, 'Patient')[0];
  if (!patient) return fallbackPatient;
  return {
    ...fallbackPatient,
    fullName: safeArray(patient.name)[0]?.text || [safeArray(patient.name)[0]?.given?.join(' '), safeArray(patient.name)[0]?.family].filter(Boolean).join(' ') || fallbackPatient.fullName,
    documentType: fallbackPatient.documentType,
    documentNumber: fallbackPatient.documentNumber,
    birthDate: patient.birthDate || fallbackPatient.birthDate,
    sex: patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : fallbackPatient.sex,
    insurer: fallbackPatient.insurer
  };
}

function mapMinisterioBundleToRdas(bundle, fallbackPatient) {
  const organizationMap = buildOrganizationMap(bundle);
  const encounterMap = buildEncounterMap(bundle);
  const compositions = getBundleEntriesByType(bundle, 'Composition');
  const encounters = compositions.length ? compositions : getBundleEntriesByType(bundle, 'Encounter');

  const rdas = encounters.map((resource) => {
    const encounter = resource.resourceType === 'Encounter'
      ? resource
      : encounterMap[getReferenceId(resource.encounter?.reference)] || null;
    const organization = organizationMap[getReferenceId(resource.custodian?.reference || encounter?.serviceProvider?.reference)] || null;
    const typeSource = [
      getText(resource.title),
      getCodingDisplay(resource.type),
      getCodingDisplay(encounter?.class),
      getCodingDisplay(encounter?.serviceType)
    ].filter(Boolean).join(' ');

    return mapRdaBase({
      id: resource.id,
      recordCode: resource.identifier?.[0]?.value || resource.id || encounter?.id,
      attentionDate: resource.date || encounter?.period?.start || '',
      type: typeSource,
      entity: organization?.name || getText(encounter?.serviceProvider?.display) || 'Ministerio',
      municipio: organization?.address?.[0]?.city || 'No registrado',
      serviceProfessional: getText(encounter?.serviceType) || getText(resource.author?.[0]?.display) || 'No registrado',
      mainDiagnosis: getCodingDisplay(resource.type) || 'No registrado',
      mainProcedure: getText(resource.title) || getText(encounter?.reasonCode?.[0]) || 'No registrado',
      documentClass: resource.resourceType
    });
  });

  return {
    patient: extractPatientFromBundle(bundle, fallbackPatient),
    rdas
  };
}

function mapMinisterioBundleToDetail(bundle, recordCode) {
  const organizationMap = buildOrganizationMap(bundle);
  const encounterMap = buildEncounterMap(bundle);
  const observationMap = buildObservationMap(bundle);
  const medicationMap = buildMedicationMap(bundle);
  const procedureMap = buildProcedureMap(bundle);
  const conditionMap = buildConditionMap(bundle);
  const documentReferenceMap = buildDocumentReferenceMap(bundle);
  const compositions = getBundleEntriesByType(bundle, 'Composition');

  const resource = compositions.find((item) => (item.identifier?.[0]?.value || item.id) === recordCode)
    || getBundleEntriesByType(bundle, 'Encounter').find((item) => item.id === recordCode);
  if (!resource) return null;

  const encounter = resource.resourceType === 'Encounter'
    ? resource
    : encounterMap[getReferenceId(resource.encounter?.reference)] || null;
  const encounterId = encounter?.id || getReferenceId(resource.encounter?.reference);
  const organization = organizationMap[getReferenceId(resource.custodian?.reference || encounter?.serviceProvider?.reference)] || null;
  const diagnoses = safeArray(conditionMap[encounterId]).map((item) => ({
    code: safeArray(item.code?.coding)[0]?.code || 'N/A',
    description: getCodingDisplay(item.code) || 'No registrado'
  }));
  const procedures = safeArray(procedureMap[encounterId]).map((item) => ({
    code: safeArray(item.code?.coding)[0]?.code || 'N/A',
    description: getCodingDisplay(item.code) || 'No registrado'
  }));
  const medications = safeArray(medicationMap[encounterId]).map((item) => ({
    name: getCodingDisplay(item.medicationCodeableConcept) || 'No registrado',
    dosage: safeArray(item.dosageInstruction)[0]?.text || 'N/A'
  }));
  const observations = safeArray(observationMap[encounterId]).map((item) => ({
    note: getText(item.valueString) || getText(item.code) || 'No registrado'
  }));
  const documents = safeArray(documentReferenceMap[encounterId]).map((item) => ({
    name: getText(item.description) || 'Documento',
    reference: item.id || 'N/A'
  }));
  const timeline = [];
  if (encounter?.period?.start) {
    timeline.push({ time: encounter.period.start, event: 'Inicio de atención' });
  }
  if (encounter?.period?.end) {
    timeline.push({ time: encounter.period.end, event: 'Fin de atención' });
  }

  const detail = mapRdaBase({
    id: resource.id,
    recordCode: resource.identifier?.[0]?.value || resource.id || encounter?.id,
    attentionDate: resource.date || encounter?.period?.start || '',
    type: [getText(resource.title), getCodingDisplay(resource.type), getCodingDisplay(encounter?.class)].filter(Boolean).join(' '),
    entity: organization?.name || getText(encounter?.serviceProvider?.display) || 'Ministerio',
    municipio: organization?.address?.[0]?.city || 'No registrado',
    serviceProfessional: getText(encounter?.serviceType) || getText(resource.author?.[0]?.display) || 'No registrado',
    mainDiagnosis: diagnoses[0]?.description || 'No registrado',
    mainProcedure: procedures[0]?.description || getText(resource.title) || 'No registrado',
    documentClass: resource.resourceType,
    clinicalSummary: getText(resource.title) || 'Documento clínico FHIR',
    diagnoses,
    procedures,
    medications,
    observations,
    documents,
    timeline,
    composition: {
      profile: resource.resourceType,
      status: resource.status || 'final',
      notes: 'Detalle construido desde Bundle FHIR ministerio.'
    }
  });

  return {
    ...detail,
    groups: buildDetailGroups(detail)
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

  const mapped = rows.map(mapRdaBase);
  if (!filters.rdaType) return mapped;
  return mapped.filter((row) => row.type === filters.rdaType);
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

  if (base) {
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

  const bundle = readMinisterioSampleBundle();
  if (!bundle) return null;
  return mapMinisterioBundleToDetail(bundle, recordCode);
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
    endpoint: '/v1/fhir/Bundle',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MINISTERIO_TOKEN || 'mock-token'}`,
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
      'X-Source-System': 'med-rda'
    },
    body: {
      resourceType: 'Parameters',
      parameter: [
        { name: 'tipoDocumento', valueString: payload.documentType },
        { name: 'numeroDocumento', valueString: payload.documentNumber },
        { name: 'fechaDesde', valueString: payload.fromDate || '' },
        { name: 'fechaHasta', valueString: payload.toDate || '' },
        { name: 'tipoRda', valueString: payload.rdaType || '' }
      ]
    }
  };
}

async function fetchPatientRdas(db, patient, filters = {}) {
  const provider = String(process.env.DATA_PROVIDER || 'local');
  const ministerioEnabled = String(process.env.MINISTERIO_ENABLED || '') === 'true';

  if (provider !== 'ministerio' || !ministerioEnabled) {
    return { provider: 'local', patient, rdas: await listPatientRdas(db, patient.id, filters) };
  }

  const request = buildMinisterioRequest({ ...patient, ...filters });

  try {
    if (String(process.env.MINISTERIO_FORCE_FAIL || '').toLowerCase() === 'true') {
      throw new Error('Servicio ministerio no disponible.');
    }

    const bundle = readMinisterioSampleBundle();
    if (bundle?.resourceType === 'Bundle') {
      const mapped = mapMinisterioBundleToRdas(bundle, patient);
      const rdas = filters.rdaType
        ? mapped.rdas.filter((row) => row.type === filters.rdaType)
        : mapped.rdas;
      return { provider: 'ministerio', request, patient: mapped.patient, rdas };
    }

    const localAsMappedResponse = await listPatientRdas(db, patient.id, filters);
    return { provider: 'ministerio', request, patient, rdas: localAsMappedResponse };
  } catch (error) {
    return {
      provider: 'local',
      fallbackReason: error.message,
      request,
      patient,
      rdas: await listPatientRdas(db, patient.id, filters)
    };
  }
}

module.exports = {
  queryPatient,
  listPatientRdas,
  fetchPatientRdas,
  getRdaDetail,
  getSummary,
  getDocument,
  buildMinisterioRequest
};
