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
  if (raw.includes('paciente') || raw.includes('apoyo') || raw.includes('control') || raw.includes('procedimiento')) {
    return OFFICIAL_RDA_TYPES.PACIENTE;
  }
  if (raw.includes('consulta') || raw.includes('ambulator')) {
    return OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA;
  }
  return OFFICIAL_RDA_TYPES.PACIENTE;
}

function field(key, getValue = (detail) => detail[key]) {
  return { key, getValue };
}

const DETAIL_SCHEMAS_BY_TYPE = {
  [OFFICIAL_RDA_TYPES.PACIENTE]: [
    {
      title: 'Antecedentes patológicos personales',
      fields: [field('personalHistory')]
    },
    {
      title: 'Antecedentes farmacológicos',
      fields: [field('pharmacologicalHistory')]
    },
    {
      title: 'Alergias / intolerancias',
      fields: [field('allergies')]
    },
    {
      title: 'Antecedentes familiares',
      fields: [field('familyHistory')]
    },
    {
      title: 'Factores de riesgo',
      fields: [field('riskFactors')]
    }
  ],
  [OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA]: [
    {
      title: 'Contexto de la atención',
      fields: [field('attentionDate'), field('entity'), field('municipio'), field('serviceProfessional'), field('clinicalSummary')]
    },
    {
      title: 'Diagnósticos',
      fields: [field('diagnoses')]
    },
    {
      title: 'Medicamentos prescritos',
      fields: [field('medicationsPrescribed', (detail) => detail.medicationsPrescribed || detail.medications)]
    },
    {
      title: 'Alergias',
      fields: [field('allergies')]
    },
    {
      title: 'Procedimientos',
      fields: [field('procedures')]
    }
  ],
  [OFFICIAL_RDA_TYPES.HOSPITALIZACION]: [
    {
      title: 'Ingreso y estancia',
      fields: [field('attentionDate'), field('entity'), field('municipio'), field('serviceProfessional'), field('clinicalSummary'), field('timeline')]
    },
    {
      title: 'Diagnósticos',
      fields: [field('diagnoses')]
    },
    {
      title: 'Medicamentos administrados',
      fields: [field('medicationsAdministered', (detail) => detail.medicationsAdministered || detail.medications)]
    },
    {
      title: 'Alergias',
      fields: [field('allergies')]
    },
    {
      title: 'Procedimientos',
      fields: [field('procedures')]
    },
    {
      title: 'Incapacidad laboral',
      fields: [field('workDisability')]
    }
  ],
  [OFFICIAL_RDA_TYPES.URGENCIAS]: [
    {
      title: 'Triage',
      fields: [field('triage')]
    },
    {
      title: 'Diagnósticos',
      fields: [field('diagnoses')]
    },
    {
      title: 'Medicamentos administrados',
      fields: [field('medicationsAdministered', (detail) => detail.medicationsAdministered || detail.medications)]
    },
    {
      title: 'Alergias',
      fields: [field('allergies')]
    },
    {
      title: 'Procedimientos',
      fields: [field('procedures')]
    }
  ]
};

function buildDetailGroups(detail) {
  const schema = DETAIL_SCHEMAS_BY_TYPE[detail.type] || DETAIL_SCHEMAS_BY_TYPE[OFFICIAL_RDA_TYPES.PACIENTE];
  return schema.map((group) => ({
    title: group.title,
    fields: group.fields.map((definition) => ({ key: definition.key, value: definition.getValue(detail) }))
  }));
}

module.exports = {
  OFFICIAL_RDA_TYPES,
  RDA_TYPE_LABELS,
  DETAIL_SCHEMAS_BY_TYPE,
  buildDetailGroups,
  normalizeRdaType
};
