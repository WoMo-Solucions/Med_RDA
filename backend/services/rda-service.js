const fs = require('fs');
const path = require('path');
const { all, get } = require('../db/database');
const { RDA_TYPE_LABELS, buildDetailGroups, normalizeRdaType } = require('./rda-schema');

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


function isNonEmpty(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.values(value).some(isNonEmpty);
  return String(value || '').trim().length > 0;
}

function uniqueCollection(items, uniqueKey) {
  const seen = new Set();
  return safeArray(items).filter((item) => {
    const key = uniqueKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toDiagnosisEntries(items) {
  return safeArray(items).map((item) => ({
    code: item.code || 'N/A',
    description: item.description || 'No registrado'
  }));
}

function toMedicationEntries(items, routeLabel) {
  return safeArray(items).map((item) => ({
    name: item.name || 'No registrado',
    dosage: item.dosage || 'No registrado',
    route: routeLabel || item.route || ''
  }));
}

function toAllergyEntries(items) {
  return safeArray(items).map((item) => ({
    substance: item.substance || item.name || item.description || 'No registrado',
    criticality: item.criticality || item.severity || 'No registrado',
    manifestation: item.manifestation || item.note || 'No registrado'
  }));
}

function buildDerivedDetailFields(detail) {
  const allergies = toAllergyEntries(detail.allergies);
  const diagnoses = toDiagnosisEntries(detail.diagnoses);
  const medications = toMedicationEntries(detail.medications);
  const procedures = safeArray(detail.procedures).map((item) => ({
    code: item.code || 'N/A',
    description: item.description || 'No registrado'
  }));
  const observations = safeArray(detail.observations).map((item) => item.note || 'No registrado');

  if (detail.type === 'RDA_PACIENTE') {
    return {
      personalHistory: diagnoses,
      pharmacologicalHistory: medications,
      allergies,
      familyHistory: safeArray(detail.familyHistory),
      riskFactors: safeArray(detail.riskFactors).length
        ? detail.riskFactors
        : observations.map((note) => ({ factor: note }))
    };
  }

  if (detail.type === 'RDA_CONSULTA_EXTERNA') {
    return {
      diagnoses,
      medicationsPrescribed: medications.length ? medications.map((item) => ({ ...item, status: 'Prescrito' })) : [],
      allergies,
      procedures
    };
  }

  if (detail.type === 'RDA_HOSPITALIZACION') {
    return {
      diagnoses,
      medicationsAdministered: medications.length ? medications.map((item) => ({ ...item, status: 'Administrado' })) : [],
      allergies,
      procedures,
      workDisability: safeArray(detail.workDisability)
    };
  }

  if (detail.type === 'RDA_URGENCIAS') {
    const triage = safeArray(detail.triage).length
      ? detail.triage
      : safeArray(detail.observations).slice(0, 1).map((item) => ({
          category: 'Clasificación inicial',
          finding: item.note || 'No registrado',
          source: 'Observación de ingreso'
        }));
    return {
      triage,
      diagnoses,
      medicationsAdministered: medications.length ? medications.map((item) => ({ ...item, status: 'Administrado' })) : [],
      allergies,
      procedures
    };
  }

  return {};
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
  for (const resourceType of ['MedicationRequest', 'MedicationAdministration']) {
    for (const resource of getBundleEntriesByType(bundle, resourceType)) {
      const encounterId = getReferenceId(resource.encounter?.reference || resource.context?.reference);
      if (!encounterId) continue;
      groups[encounterId] = groups[encounterId] || [];
      groups[encounterId].push({
        medicationCodeableConcept: resource.medicationCodeableConcept,
        dosageInstruction: resource.dosageInstruction,
        dosage: resource.dosage ? [{ text: resource.dosage.text || getText(resource.dosage.route) }] : []
      });
    }
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


function buildAllergyMap(bundle) {
  const byEncounter = {};
  const byPatient = {};
  for (const resource of getBundleEntriesByType(bundle, 'AllergyIntolerance')) {
    const encounterId = getReferenceId(resource.encounter?.reference);
    const patientId = getReferenceId(resource.patient?.reference);
    const mapped = {
      substance: getCodingDisplay(resource.code) || 'No registrado',
      criticality: resource.criticality || 'No registrado',
      manifestation: safeArray(resource.reaction)[0]?.manifestation?.map(getCodingDisplay).filter(Boolean).join(', ') || 'No registrado'
    };
    if (encounterId) {
      byEncounter[encounterId] = byEncounter[encounterId] || [];
      byEncounter[encounterId].push(mapped);
    }
    if (patientId) {
      byPatient[patientId] = byPatient[patientId] || [];
      byPatient[patientId].push(mapped);
    }
  }
  return { byEncounter, byPatient };
}

function buildClaimMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'Claim')) {
    const encounterId = getReferenceId(resource.encounter?.reference);
    if (!encounterId) continue;
    groups[encounterId] = groups[encounterId] || [];
    groups[encounterId].push({
      reason: getCodingDisplay(resource.type) || getText(resource.use) || 'No registrado',
      status: resource.status || 'No registrado'
    });
  }
  return groups;
}

function buildFamilyHistoryMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'FamilyMemberHistory')) {
    const patientId = getReferenceId(resource.patient?.reference);
    if (!patientId) continue;
    groups[patientId] = groups[patientId] || [];
    groups[patientId].push({
      relationship: getCodingDisplay(resource.relationship) || 'No registrado',
      condition: safeArray(resource.condition).map((item) => getCodingDisplay(item.code)).filter(Boolean).join(', ') || 'No registrado'
    });
  }
  return groups;
}

function buildMedicationStatementMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'MedicationStatement')) {
    const patientId = getReferenceId(resource.subject?.reference);
    if (!patientId) continue;
    groups[patientId] = groups[patientId] || [];
    groups[patientId].push({
      name: getCodingDisplay(resource.medicationCodeableConcept) || 'No registrado',
      dosage: safeArray(resource.dosage)[0]?.text || 'No registrado'
    });
  }
  return groups;
}

function buildPatientConditionMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'Condition')) {
    const patientId = getReferenceId(resource.subject?.reference);
    if (!patientId) continue;
    groups[patientId] = groups[patientId] || [];
    groups[patientId].push({
      code: safeArray(resource.code?.coding)[0]?.code || 'N/A',
      description: getCodingDisplay(resource.code) || 'No registrado'
    });
  }
  return groups;
}

function buildRiskFactorMap(bundle) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, 'Observation')) {
    const patientId = getReferenceId(resource.subject?.reference);
    const categoryText = safeArray(resource.category).map(getCodingDisplay).join(' ').toLowerCase();
    if (!patientId || (!categoryText.includes('social') && !categoryText.includes('risk'))) continue;
    groups[patientId] = groups[patientId] || [];
    groups[patientId].push({
      factor: getCodingDisplay(resource.code) || 'No registrado',
      value: getText(resource.valueString) || getText(resource.valueCodeableConcept) || getText(resource.valueQuantity) || 'No registrado'
    });
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
  const allergyMap = buildAllergyMap(bundle);
  const claimMap = buildClaimMap(bundle);
  const familyHistoryMap = buildFamilyHistoryMap(bundle);
  const medicationStatementMap = buildMedicationStatementMap(bundle);
  const patientConditionMap = buildPatientConditionMap(bundle);
  const riskFactorMap = buildRiskFactorMap(bundle);
  const compositions = getBundleEntriesByType(bundle, 'Composition');

  const resource = compositions.find((item) => (item.identifier?.[0]?.value || item.id) === recordCode)
    || getBundleEntriesByType(bundle, 'Encounter').find((item) => item.id === recordCode);
  if (!resource) return null;

  const encounter = resource.resourceType === 'Encounter'
    ? resource
    : encounterMap[getReferenceId(resource.encounter?.reference)] || null;
  const encounterId = encounter?.id || getReferenceId(resource.encounter?.reference);
  const patientId = getReferenceId(resource.subject?.reference || encounter?.subject?.reference);
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
    allergies: uniqueCollection([...(allergyMap.byEncounter[encounterId] || []), ...(allergyMap.byPatient[patientId] || [])], (item) => `${item.substance}|${item.manifestation}`),
    workDisability: safeArray(claimMap[encounterId]),
    familyHistory: safeArray(familyHistoryMap[patientId]),
    personalHistory: safeArray(patientConditionMap[patientId]),
    pharmacologicalHistory: safeArray(medicationStatementMap[patientId]),
    riskFactors: safeArray(riskFactorMap[patientId]),
    composition: {
      profile: resource.resourceType,
      status: resource.status || 'final',
      notes: 'Detalle construido desde Bundle FHIR ministerio.'
    }
  });

  const enriched = { ...detail, ...buildDerivedDetailFields(detail) };
  return {
    ...enriched,
    groups: buildDetailGroups(enriched)
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
      allergies: [],
      workDisability: [],
      familyHistory: [],
      personalHistory: [],
      pharmacologicalHistory: [],
      riskFactors: [],
      triage: [],
      composition: composition || null
    });

    const enriched = { ...detail, ...buildDerivedDetailFields(detail) };

    return {
      ...enriched,
      groups: buildDetailGroups(enriched)
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
