const OFFICIAL_RDA_TYPES = {
  PACIENTE: 'RDA_PACIENTE',
  CONSULTA_EXTERNA: 'RDA_CONSULTA_EXTERNA',
  HOSPITALIZACION: 'RDA_HOSPITALIZACION',
  URGENCIAS: 'RDA_URGENCIAS'
};

const RDA_TYPE_LABELS = {
  [OFFICIAL_RDA_TYPES.PACIENTE]: 'Paciente',
  [OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA]: 'Consulta externa',
  [OFFICIAL_RDA_TYPES.HOSPITALIZACION]: 'Hospitalización',
  [OFFICIAL_RDA_TYPES.URGENCIAS]: 'Urgencias'
};

function normalizeRdaType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return OFFICIAL_RDA_TYPES.PACIENTE;
  if (raw.includes('urg')) return OFFICIAL_RDA_TYPES.URGENCIAS;
  if (raw.includes('hosp')) return OFFICIAL_RDA_TYPES.HOSPITALIZACION;
  if (raw.includes('consulta') || raw.includes('control') || raw.includes('apoyo') || raw.includes('ambulator')) {
    return OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA;
  }
  return OFFICIAL_RDA_TYPES.PACIENTE;
}

const DETAIL_GROUPS_BY_TYPE = {
  [OFFICIAL_RDA_TYPES.PACIENTE]: [
    { title: 'Consulta y contexto', fields: ['attentionDate', 'entity', 'municipio', 'serviceProfessional', 'clinicalSummary'] },
    { title: 'Evaluación clínica', fields: ['procedures', 'observations'] },
    { title: 'Diagnósticos', fields: ['diagnoses'] },
    { title: 'Plan y soportes', fields: ['medications', 'documents', 'timeline'] }
  ],
  [OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA]: [
    { title: 'Consulta y contexto', fields: ['attentionDate', 'entity', 'municipio', 'serviceProfessional', 'clinicalSummary'] },
    { title: 'Evaluación clínica', fields: ['procedures', 'observations'] },
    { title: 'Diagnósticos', fields: ['diagnoses'] },
    { title: 'Plan y soportes', fields: ['medications', 'documents', 'timeline'] }
  ],
  [OFFICIAL_RDA_TYPES.HOSPITALIZACION]: [
    { title: 'Ingreso y estancia', fields: ['attentionDate', 'entity', 'municipio', 'serviceProfessional', 'clinicalSummary'] },
    { title: 'Evaluación clínica', fields: ['procedures', 'observations'] },
    { title: 'Diagnósticos', fields: ['diagnoses'] },
    { title: 'Plan y egreso', fields: ['medications', 'documents', 'timeline'] }
  ],
  [OFFICIAL_RDA_TYPES.URGENCIAS]: [
    { title: 'Consulta y contexto', fields: ['attentionDate', 'entity', 'municipio', 'serviceProfessional', 'clinicalSummary'] },
    { title: 'Evaluación clínica', fields: ['procedures', 'observations'] },
    { title: 'Diagnósticos', fields: ['diagnoses'] },
    { title: 'Plan y soportes', fields: ['medications', 'documents', 'timeline'] }
  ]
};

module.exports = {
  OFFICIAL_RDA_TYPES,
  RDA_TYPE_LABELS,
  DETAIL_GROUPS_BY_TYPE,
  normalizeRdaType
};
