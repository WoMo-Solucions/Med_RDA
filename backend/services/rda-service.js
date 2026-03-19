const fs = require('fs');
const path = require('path');
const { all, get } = require('../db/database');
const {
  DETAIL_GROUPS_BY_TYPE,
  RDA_TYPE_LABELS,
  normalizeRdaType
} = require('./rda-schema');

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

function formatAgeLabel(birthDate) {
  if (!birthDate) return 'N/A';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 'N/A';
  const diffMs = Date.now() - birth.getTime();
  if (diffMs < 0) return 'N/A';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours} horas`;

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 31) return `${diffDays} días`;

  const diffMonths = Math.floor(diffDays / 30.4375);
  if (diffMonths < 24) return `${diffMonths} meses`;

  const diffYears = Math.floor(diffDays / 365.25);
  return `${diffYears} años`;
}

function createNormalizedPatient(patient) {
  return {
    ...patient,
    ageLabel: formatAgeLabel(patient.birthDate)
  };
}

function mapRdaBase(row) {
  const normalizedType = normalizeRdaType(row.type || row.rda_type);
  const entity = row.entity || row.providerName || '';
  return {
    ...row,
    type: normalizedType,
    typeLabel: RDA_TYPE_LABELS[normalizedType],
    municipio: row.municipio || row.providerCity || MUNICIPALITY_BY_ENTITY[entity] || 'No registrado',
    entity,
    sourceProvider: row.sourceProvider || 'local',
    sourceFormat: row.sourceFormat || 'normalized-rda'
  };
}

function readMinisterioSampleBundle() {
  const samplePath = String(process.env.MINISTERIO_SAMPLE_FILE || '').trim();
  if (!samplePath) return null;
  const resolved = path.resolve(process.cwd(), samplePath);
  if (!fs.existsSync(resolved)) return null;
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

function readLocalJsonData() {
  const localJsonPath = path.resolve(__dirname, '../../assets/data/mock-rda.json');
  if (!fs.existsSync(localJsonPath)) return { patients: [] };
  return JSON.parse(fs.readFileSync(localJsonPath, 'utf8'));
}

function getReferenceId(reference) {
  return String(reference || '').split('/').pop();
}

function getBundleEntriesByType(bundle, resourceType) {
  return safeArray(bundle?.entry)
    .map((entry) => entry?.resource)
    .filter((resource) => resource?.resourceType === resourceType);
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    if (!value) return [];
    return [String(value)];
  }

  return value
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      if (item.label && item.value) return `${item.label}: ${item.value}`;
      if (item.code && item.description) return `${item.code} - ${item.description}`;
      if (item.name && item.dosage) return `${item.name} (${item.dosage})`;
      if (item.name && item.reference) return `${item.name}: ${item.reference}`;
      if (item.time && item.event) return `${item.time}: ${item.event}`;
      return Object.values(item).filter(Boolean).join(' - ');
    })
    .filter(Boolean);
}

function hasRenderableValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return String(value || '').trim().length > 0;
}

function normalizePatientSummary(patient) {
  const normalized = createNormalizedPatient(patient);
  return {
    patientName: normalized.fullName,
    patientDocument: `${normalized.documentType} ${normalized.documentNumber}`,
    patientSex: normalized.sex,
    patientBirthDate: normalized.birthDate,
    patientAgeLabel: normalized.ageLabel,
    payerName: normalized.insurer
  };
}

function buildNormalizedDetail(type, detail, patient, overrides = {}) {
  const patientSummary = normalizePatientSummary(patient || {});
  const normalized = mapRdaBase({
    ...detail,
    type,
    careType: RDA_TYPE_LABELS[normalizeRdaType(type)],
    providerName: detail.providerName || detail.entity || 'No registrado',
    providerCity: detail.providerCity || detail.municipio || 'No registrado',
    payerName: detail.payerName || patientSummary.payerName || 'No registrado',
    patientName: detail.patientName || patientSummary.patientName || 'No registrado',
    patientDocument: detail.patientDocument || patientSummary.patientDocument || 'No registrado',
    patientSex: detail.patientSex || patientSummary.patientSex || 'No registrado',
    patientBirthDate: detail.patientBirthDate || patientSummary.patientBirthDate || 'No registrado',
    patientAgeLabel: detail.patientAgeLabel || patientSummary.patientAgeLabel || 'N/A',
    healthBackground: normalizeList(detail.healthBackground),
    allergies: normalizeList(detail.allergies),
    historicalMedications: normalizeList(detail.historicalMedications),
    diagnoses: normalizeList(detail.diagnoses),
    orderedMedications: normalizeList(detail.orderedMedications),
    orderedProcedures: normalizeList(detail.orderedProcedures),
    performedProcedures: normalizeList(detail.performedProcedures),
    administeredMedications: normalizeList(detail.administeredMedications),
    administeredTechnologies: normalizeList(detail.administeredTechnologies),
    dischargeMedications: normalizeList(detail.dischargeMedications),
    dischargeProcedures: normalizeList(detail.dischargeProcedures),
    dischargeTechnologies: normalizeList(detail.dischargeTechnologies),
    supportDocuments: normalizeList(detail.supportDocuments),
    incapacity: detail.incapacity || '',
    dischargeProfessional: detail.dischargeProfessional || '',
    serviceProfessional: detail.serviceProfessional || '',
    ...overrides
  });

  return {
    ...normalized,
    groups: buildDetailGroups(normalized)
  };
}

function mapLocalPatient(patient) {
  if (!patient) return null;
  return createNormalizedPatient({
    id: patient.id,
    fullName: patient.fullName,
    documentType: patient.documentType,
    documentNumber: patient.documentNumber,
    sex: patient.sex,
    birthDate: patient.birthDate,
    insurer: patient.insurer,
    age: patient.age ?? null
  });
}

function mapLocalRdaRecord(record) {
  return mapRdaBase({
    recordCode: record.id || record.recordCode,
    attentionDate: record.attentionDate,
    type: record.type,
    entity: record.entity,
    municipio: record.municipio,
    serviceProfessional: record.serviceProfessional,
    mainDiagnosis: record.mainDiagnosis,
    mainProcedure: record.mainProcedure,
    documentClass: 'LocalJSON',
    sourceProvider: 'local',
    sourceFormat: 'json-fhir-sim'
  });
}

function mapLocalRdaDetail(record, patient) {
  return buildNormalizedDetail(record.type, {
    recordCode: record.id || record.recordCode,
    attentionDate: record.attentionDate,
    entity: record.entity,
    municipio: record.municipio,
    mainDiagnosis: record.mainDiagnosis,
    mainProcedure: record.mainProcedure,
    serviceProfessional: record.serviceProfessional,
    clinicalSummary: record.clinicalSummary,
    healthBackground: record.healthBackground || record.observations || [],
    allergies: record.allergies || [],
    historicalMedications: record.historicalMedications || [],
    diagnoses: record.diagnoses || [],
    orderedMedications: record.type === 'RDA_CONSULTA_EXTERNA' ? record.medications || [] : [],
    orderedProcedures: record.type === 'RDA_CONSULTA_EXTERNA' ? record.procedures || [] : [],
    performedProcedures: record.type === 'RDA_CONSULTA_EXTERNA' ? [] : record.procedures || [],
    administeredMedications:
      record.type === 'RDA_HOSPITALIZACION' || record.type === 'RDA_URGENCIAS' ? record.medications || [] : [],
    administeredTechnologies: record.administeredTechnologies || [],
    dischargeMedications:
      record.type === 'RDA_HOSPITALIZACION' || record.type === 'RDA_URGENCIAS' ? record.dischargeMedications || record.medications || [] : [],
    dischargeProcedures:
      record.type === 'RDA_HOSPITALIZACION' || record.type === 'RDA_URGENCIAS' ? record.dischargeProcedures || [] : [],
    dischargeTechnologies:
      record.type === 'RDA_HOSPITALIZACION' || record.type === 'RDA_URGENCIAS' ? record.dischargeTechnologies || [] : [],
    supportDocuments: record.documents || [],
    incapacity: record.incapacity || '',
    dischargeProfessional: record.dischargeProfessional || '',
    sourceProvider: 'local',
    sourceFormat: 'json-fhir-sim'
  }, patient);
}

function buildOrganizationMap(bundle) {
  return Object.fromEntries(getBundleEntriesByType(bundle, 'Organization').map((resource) => [resource.id, resource]));
}

function buildEncounterMap(bundle) {
  return Object.fromEntries(getBundleEntriesByType(bundle, 'Encounter').map((resource) => [resource.id, resource]));
}

function buildEncounterGroupedMap(bundle, resourceType, referencePath) {
  const groups = {};
  for (const resource of getBundleEntriesByType(bundle, resourceType)) {
    const encounterId = getReferenceId(referencePath(resource));
    if (!encounterId) continue;
    groups[encounterId] = groups[encounterId] || [];
    groups[encounterId].push(resource);
  }
  return groups;
}

function extractPatientFromBundle(bundle, fallbackPatient) {
  const patient = getBundleEntriesByType(bundle, 'Patient')[0];
  if (!patient) return createNormalizedPatient(fallbackPatient);
  return createNormalizedPatient({
    ...fallbackPatient,
    fullName:
      safeArray(patient.name)[0]?.text ||
      [safeArray(patient.name)[0]?.given?.join(' '), safeArray(patient.name)[0]?.family].filter(Boolean).join(' ') ||
      fallbackPatient.fullName,
    documentType: fallbackPatient.documentType,
    documentNumber: fallbackPatient.documentNumber,
    birthDate: patient.birthDate || fallbackPatient.birthDate,
    sex: patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : fallbackPatient.sex,
    insurer: fallbackPatient.insurer
  });
}

function mapMinisterioBundleToRdas(bundle, fallbackPatient) {
  const organizationMap = buildOrganizationMap(bundle);
  const encounterMap = buildEncounterMap(bundle);
  const compositions = getBundleEntriesByType(bundle, 'Composition');
  const resources = compositions.length ? compositions : getBundleEntriesByType(bundle, 'Encounter');

  const rdas = resources.map((resource) => {
    const encounter = resource.resourceType === 'Encounter'
      ? resource
      : encounterMap[getReferenceId(resource.encounter?.reference)] || null;
    const organization = organizationMap[getReferenceId(resource.custodian?.reference || encounter?.serviceProvider?.reference)] || null;
    const typeSource = [getText(resource.title), getCodingDisplay(resource.type), getCodingDisplay(encounter?.class)].filter(Boolean).join(' ');

    return mapRdaBase({
      recordCode: resource.identifier?.[0]?.value || resource.id || encounter?.id,
      attentionDate: resource.date || encounter?.period?.start || '',
      type: typeSource,
      entity: organization?.name || getText(encounter?.serviceProvider?.display) || 'Ministerio',
      municipio: organization?.address?.[0]?.city || 'No registrado',
      serviceProfessional: getText(resource.author?.[0]?.display) || getText(encounter?.serviceType) || 'No registrado',
      mainDiagnosis: getCodingDisplay(resource.type) || 'No registrado',
      mainProcedure: getText(resource.title) || getText(encounter?.reasonCode?.[0]) || 'No registrado',
      documentClass: resource.resourceType,
      sourceProvider: 'ministerio',
      sourceFormat: 'bundle-fhir'
    });
  });

  return {
    patient: extractPatientFromBundle(bundle, fallbackPatient),
    rdas
  };
}

function mapMinisterioBundleToDetail(bundle, recordCode, fallbackPatient) {
  const organizationMap = buildOrganizationMap(bundle);
  const encounterMap = buildEncounterMap(bundle);
  const conditionMap = buildEncounterGroupedMap(bundle, 'Condition', (resource) => resource.encounter?.reference);
  const procedureMap = buildEncounterGroupedMap(bundle, 'Procedure', (resource) => resource.encounter?.reference);
  const medicationMap = buildEncounterGroupedMap(bundle, 'MedicationRequest', (resource) => resource.encounter?.reference);
  const allergyResources = getBundleEntriesByType(bundle, 'AllergyIntolerance');
  const practitionerMap = Object.fromEntries(getBundleEntriesByType(bundle, 'Practitioner').map((resource) => [resource.id, resource]));
  const documentReferenceMap = buildEncounterGroupedMap(
    bundle,
    'DocumentReference',
    (resource) => resource.context?.encounter?.[0]?.reference || resource.context?.encounter?.reference
  );
  const compositions = getBundleEntriesByType(bundle, 'Composition');
  const resource = compositions.find((item) => (item.identifier?.[0]?.value || item.id) === recordCode)
    || getBundleEntriesByType(bundle, 'Encounter').find((item) => item.id === recordCode);

  if (!resource) return null;

  const encounter = resource.resourceType === 'Encounter'
    ? resource
    : encounterMap[getReferenceId(resource.encounter?.reference)] || null;
  const encounterId = encounter?.id || getReferenceId(resource.encounter?.reference);
  const organization = organizationMap[getReferenceId(resource.custodian?.reference || encounter?.serviceProvider?.reference)] || null;
  const patient = extractPatientFromBundle(bundle, fallbackPatient || {});
  const practitioner = practitionerMap[getReferenceId(resource.author?.[0]?.reference)] || null;
  const diagnoses = safeArray(conditionMap[encounterId]).map((item) => getCodingDisplay(item.code) || 'No registrado');
  const procedures = safeArray(procedureMap[encounterId]).map((item) => getCodingDisplay(item.code) || 'No registrado');
  const medications = safeArray(medicationMap[encounterId]).map(
    (item) => getCodingDisplay(item.medicationCodeableConcept) || safeArray(item.contained)[0]?.code?.text || 'No registrado'
  );
  const allergies = allergyResources.map((item) => getCodingDisplay(item.code) || 'No registrado');
  const documents = safeArray(documentReferenceMap[encounterId]).map((item) => ({
    name: getText(item.description) || 'Documento',
    reference: item.id || 'N/A'
  }));

  return buildNormalizedDetail(normalizeRdaType([getText(resource.title), getCodingDisplay(resource.type)].join(' ')), {
    recordCode: resource.identifier?.[0]?.value || resource.id || encounter?.id,
    attentionDate: resource.date || encounter?.period?.start || '',
    entity: organization?.name || getText(encounter?.serviceProvider?.display) || 'Ministerio',
    municipio: organization?.address?.[0]?.city || 'No registrado',
    serviceProfessional:
      getText(resource.author?.[0]?.display) ||
      practitioner?.name?.[0]?.text ||
      [practitioner?.name?.[0]?.given?.join(' '), practitioner?.name?.[0]?.family].filter(Boolean).join(' ') ||
      'No registrado',
    mainDiagnosis: diagnoses[0] || 'No registrado',
    mainProcedure: procedures[0] || getText(resource.title) || 'No registrado',
    clinicalSummary: getText(resource.title) || getCodingDisplay(resource.type) || 'Documento clínico FHIR',
    healthBackground: safeArray(resource.section).map((section) => section.title).filter(Boolean),
    allergies,
    diagnoses,
    performedProcedures: procedures,
    orderedProcedures: procedures,
    orderedMedications: medications,
    administeredMedications: medications,
    dischargeMedications: medications,
    supportDocuments: documents,
    dischargeProfessional:
      getText(resource.author?.[0]?.display) || practitioner?.name?.[0]?.text || '',
    sourceProvider: 'ministerio',
    sourceFormat: 'bundle-fhir'
  }, patient);
}

function buildDetailGroups(detail) {
  const schema = DETAIL_GROUPS_BY_TYPE[detail.type] || DETAIL_GROUPS_BY_TYPE.RDA_PACIENTE;
  return schema.map((group) => ({
    title: group.title,
    fields: group.fields
      .filter((field) => hasRenderableValue(detail[field]))
      .map((field) => ({ key: field, value: detail[field] }))
  }));
}

async function queryPatient(db, { documentType, documentNumber }) {
  const type = normalizeDoc(documentType);
  const number = String(documentNumber || '').trim();
  if (!type || !number) return null;

  const localPatient = mapLocalPatient(
    safeArray(readLocalJsonData().patients).find(
      (patient) => patient.documentType === type && patient.documentNumber === number
    )
  );
  if (localPatient) return localPatient;

  const patient = await get(
    db,
    `SELECT id, full_name AS fullName, document_type AS documentType, document_number AS documentNumber, sex, birth_date AS birthDate, insurer
     FROM patients WHERE document_type = ? AND document_number = ?`,
    [type, number]
  );

  if (!patient) return null;
  return createNormalizedPatient(patient);
}

async function listPatientRdas(db, patientId, filters = {}) {
  const localPatient = safeArray(readLocalJsonData().patients).find((patient) => patient.id === patientId);
  if (localPatient) {
    let records = safeArray(localPatient.rdas).map(mapLocalRdaRecord);
    if (filters.fromDate) records = records.filter((row) => row.attentionDate >= filters.fromDate);
    if (filters.toDate) records = records.filter((row) => row.attentionDate <= filters.toDate);
    if (filters.rdaType) records = records.filter((row) => row.type === filters.rdaType);
    return records.sort((a, b) => String(b.attentionDate).localeCompare(String(a.attentionDate)));
  }

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

  const mapped = rows.map((row) => mapRdaBase({ ...row, sourceProvider: 'local', sourceFormat: 'db-sim' }));
  return filters.rdaType ? mapped.filter((row) => row.type === filters.rdaType) : mapped;
}

async function getRdaDetail(db, recordCode) {
  const localData = readLocalJsonData();
  for (const patient of safeArray(localData.patients)) {
    const localRecord = safeArray(patient.rdas).find((record) => (record.id || record.recordCode) === recordCode);
    if (localRecord) return mapLocalRdaDetail(localRecord, patient);
  }

  const base = await get(
    db,
    `SELECT r.id, r.record_code AS recordCode, r.attention_date AS attentionDate, r.rda_type AS type,
            i.name AS entity, r.service_professional AS serviceProfessional,
            r.main_diagnosis AS mainDiagnosis, r.main_procedure AS mainProcedure,
            r.document_class AS documentClass, r.clinical_summary AS clinicalSummary,
            p.full_name AS patientName, p.document_type AS documentType, p.document_number AS documentNumber,
            p.sex AS patientSex, p.birth_date AS patientBirthDate, p.insurer AS payerName
     FROM rda_records r
     LEFT JOIN institutions i ON i.id = r.institution_id
     LEFT JOIN patients p ON p.id = r.patient_id
     WHERE r.record_code = ?`,
    [recordCode]
  );

  if (base) {
    const [diagnoses, procedures, medications, observations, documents] = await Promise.all([
      all(db, 'SELECT code, description FROM diagnoses WHERE record_id = ?', [base.id]),
      all(db, 'SELECT code, description FROM procedures WHERE record_id = ?', [base.id]),
      all(db, 'SELECT name, dosage FROM medications WHERE record_id = ?', [base.id]),
      all(db, 'SELECT note FROM observations WHERE record_id = ?', [base.id]),
      all(db, 'SELECT name, reference FROM attachments WHERE record_id = ?', [base.id])
    ]);

    return buildNormalizedDetail(base.type, {
      recordCode: base.recordCode,
      attentionDate: base.attentionDate,
      entity: base.entity,
      serviceProfessional: base.serviceProfessional,
      mainDiagnosis: base.mainDiagnosis,
      mainProcedure: base.mainProcedure,
      clinicalSummary: base.clinicalSummary,
      healthBackground: observations.map((item) => item.note),
      diagnoses,
      orderedMedications: medications,
      administeredMedications: medications,
      dischargeMedications: medications,
      orderedProcedures: procedures,
      performedProcedures: procedures,
      supportDocuments: documents,
      payerName: base.payerName,
      patientName: base.patientName,
      patientDocument: `${base.documentType} ${base.documentNumber}`,
      patientSex: base.patientSex,
      patientBirthDate: base.patientBirthDate,
      patientAgeLabel: formatAgeLabel(base.patientBirthDate),
      sourceProvider: 'local',
      sourceFormat: 'db-sim'
    }, {
      fullName: base.patientName,
      documentType: base.documentType,
      documentNumber: base.documentNumber,
      sex: base.patientSex,
      birthDate: base.patientBirthDate,
      insurer: base.payerName
    });
  }

  const bundle = readMinisterioSampleBundle();
  if (!bundle) return null;
  return mapMinisterioBundleToDetail(bundle, recordCode, {});
}

async function getSummary(db, patientId) {
  const localPatient = safeArray(readLocalJsonData().patients).find((patient) => patient.id === patientId);
  if (localPatient) {
    const records = safeArray(localPatient.rdas);
    const orderedDates = records.map((item) => item.attentionDate).sort();
    return {
      totalRdas: records.length,
      firstAttention: orderedDates[0] || null,
      lastAttention: orderedDates[orderedDates.length - 1] || null
    };
  }

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
    return {
      provider: 'local',
      patient: createNormalizedPatient(patient),
      rdas: await listPatientRdas(db, patient.id, filters)
    };
  }

  const request = buildMinisterioRequest({ ...patient, ...filters });

  try {
    if (String(process.env.MINISTERIO_FORCE_FAIL || '').toLowerCase() === 'true') {
      throw new Error('Servicio ministerio no disponible.');
    }

    const bundle = readMinisterioSampleBundle();
    if (bundle?.resourceType === 'Bundle') {
      const mapped = mapMinisterioBundleToRdas(bundle, patient);
      const filtered = filters.rdaType ? mapped.rdas.filter((row) => row.type === filters.rdaType) : mapped.rdas;
      return { provider: 'ministerio', request, patient: mapped.patient, rdas: filtered };
    }

    return {
      provider: 'ministerio',
      request,
      patient: createNormalizedPatient(patient),
      rdas: await listPatientRdas(db, patient.id, filters)
    };
  } catch (error) {
    return {
      provider: 'local',
      fallbackReason: error.message,
      request,
      patient: createNormalizedPatient(patient),
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
