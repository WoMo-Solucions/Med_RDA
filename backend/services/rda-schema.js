const OFFICIAL_RDA_TYPES = {
  PACIENTE: 'RDA_PACIENTE',
  HOSPITALIZACION: 'RDA_HOSPITALIZACION',
  URGENCIAS: 'RDA_URGENCIAS',
  CONSULTA_EXTERNA: 'RDA_CONSULTA_EXTERNA'
};

const RDA_TYPE_LABELS = {
  [OFFICIAL_RDA_TYPES.PACIENTE]: 'RDA Paciente',
  [OFFICIAL_RDA_TYPES.HOSPITALIZACION]: 'RDA Hospitalización',
  [OFFICIAL_RDA_TYPES.URGENCIAS]: 'RDA Urgencias',
  [OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA]: 'RDA Consulta externa'
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
    { title: 'Resumen de atención', fields: ['clinicalSummary', 'entity', 'attentionDate', 'serviceProfessional'] },
    { title: 'Hallazgos clínicos', fields: ['diagnoses', 'observations'] },
    { title: 'Documentación asociada', fields: ['documents', 'timeline'] }
  ],
  [OFFICIAL_RDA_TYPES.HOSPITALIZACION]: [
    { title: 'Ingreso y estancia', fields: ['entity', 'attentionDate', 'serviceProfessional', 'clinicalSummary'] },
    { title: 'Diagnóstico y procedimientos intrahospitalarios', fields: ['diagnoses', 'procedures'] },
    { title: 'Plan terapéutico y egreso', fields: ['medications', 'observations', 'documents', 'timeline'] }
  ],
  [OFFICIAL_RDA_TYPES.URGENCIAS]: [
    { title: 'Atención inicial en urgencias', fields: ['attentionDate', 'entity', 'serviceProfessional', 'clinicalSummary'] },
    { title: 'Impresión diagnóstica y manejo', fields: ['diagnoses', 'procedures', 'medications'] },
    { title: 'Evolución y soporte documental', fields: ['observations', 'documents', 'timeline'] }
  ],
  [OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA]: [
    { title: 'Consulta y contexto', fields: ['attentionDate', 'entity', 'serviceProfessional', 'clinicalSummary'] },
    { title: 'Evaluación clínica', fields: ['diagnoses', 'procedures'] },
    { title: 'Plan ambulatorio', fields: ['medications', 'observations', 'documents', 'timeline'] }
  ]
};

module.exports = {
  OFFICIAL_RDA_TYPES,
  RDA_TYPE_LABELS,
  DETAIL_GROUPS_BY_TYPE,
  normalizeRdaType
};
