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
  if (raw.includes('hosp') || raw.includes('intern')) return OFFICIAL_RDA_TYPES.HOSPITALIZACION;
  if (raw.includes('consulta') || raw.includes('control') || raw.includes('ambulator')) {
    return OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA;
  }
  return OFFICIAL_RDA_TYPES.PACIENTE;
}

const COMMON_BLOCKS = [
  {
    title: 'Identificación del Prestador de Servicios de Salud',
    fields: ['providerName', 'providerCity']
  },
  {
    title: 'Entidad responsable por el plan de beneficios en salud',
    fields: ['payerName']
  },
  {
    title: 'Identificación del Paciente',
    fields: ['patientName', 'patientDocument', 'patientSex', 'patientBirthDate', 'patientAgeLabel']
  }
];

const DETAIL_GROUPS_BY_TYPE = {
  [OFFICIAL_RDA_TYPES.PACIENTE]: [
    ...COMMON_BLOCKS,
    {
      title: 'Datos Resumen Digital Básico de Atención en Salud - Paciente',
      fields: ['attentionDate', 'careType', 'clinicalSummary']
    },
    {
      title: 'Antecedentes de salud',
      fields: ['healthBackground', 'allergies']
    },
    {
      title: 'Listado de Medicamentos como antecedentes farmacológicos',
      fields: ['historicalMedications']
    },
    {
      title: 'Diagnósticos',
      fields: ['diagnoses']
    },
    {
      title: 'Profesional de salud',
      fields: ['serviceProfessional']
    }
  ],
  [OFFICIAL_RDA_TYPES.CONSULTA_EXTERNA]: [
    ...COMMON_BLOCKS,
    {
      title: 'Datos de la Consulta Externa',
      fields: ['attentionDate', 'careType', 'mainDiagnosis', 'mainProcedure', 'clinicalSummary', 'serviceProfessional']
    },
    {
      title: 'Antecedentes de salud',
      fields: ['healthBackground', 'allergies']
    },
    {
      title: 'Fórmula de Medicamentos ordenados en Consulta Externa (Tecnologías en Salud)',
      fields: ['orderedMedications']
    },
    {
      title: 'Ordenes médicas - Procedimientos ordenados en Consulta Externa',
      fields: ['orderedProcedures']
    },
    {
      title: 'Datos incapacidad',
      fields: ['incapacity']
    },
    {
      title: 'Documento de soporte de la consulta Externa',
      fields: ['supportDocuments']
    }
  ],
  [OFFICIAL_RDA_TYPES.HOSPITALIZACION]: [
    ...COMMON_BLOCKS,
    {
      title: 'Datos de la Hospitalización / Internación',
      fields: ['attentionDate', 'careType', 'mainDiagnosis', 'mainProcedure', 'clinicalSummary', 'serviceProfessional']
    },
    {
      title: 'Antecedentes de salud',
      fields: ['healthBackground', 'allergies']
    },
    {
      title: 'Listado de Procedimientos realizados durante la atención en Salud Hospitalización / Internación',
      fields: ['performedProcedures']
    },
    {
      title: 'Listado de Medicamentos administrados durante la atención en hospitalización / internación',
      fields: ['administeredMedications']
    },
    {
      title: 'Diagnósticos',
      fields: ['diagnoses']
    },
    {
      title: 'Fórmula de Medicamentos ordenados al egreso de la Hospitalización / internación',
      fields: ['dischargeMedications']
    },
    {
      title: 'Ordenes médicas - Procedimientos ordenados al egreso de la Hospitalización / internación',
      fields: ['dischargeProcedures']
    },
    {
      title: 'Ordenes médicas - Otras tecnologías en salud ordenadas al egreso de la Hospitalización / internación',
      fields: ['dischargeTechnologies']
    },
    {
      title: 'Datos incapacidad',
      fields: ['incapacity']
    },
    {
      title: 'Profesional de salud que dio el alta de Hospitalización / Internación',
      fields: ['dischargeProfessional']
    },
    {
      title: 'Documento de soporte de la hospitalización / internación',
      fields: ['supportDocuments']
    }
  ],
  [OFFICIAL_RDA_TYPES.URGENCIAS]: [
    ...COMMON_BLOCKS,
    {
      title: 'Datos de la Urgencias / Atención Inmediata',
      fields: ['attentionDate', 'careType', 'mainDiagnosis', 'mainProcedure', 'clinicalSummary', 'serviceProfessional']
    },
    {
      title: 'Antecedentes de salud',
      fields: ['healthBackground', 'allergies']
    },
    {
      title: 'Listado de Procedimientos realizados durante la atención en Salud Urgencias / Atención inmediata',
      fields: ['performedProcedures']
    },
    {
      title: 'Listado de Medicamentos administrados durante la Urgencias / Atención inmediata',
      fields: ['administeredMedications']
    },
    {
      title: 'Listado de otras tecnologías en salud administradas durante la Urgencias / Atención inmediata',
      fields: ['administeredTechnologies']
    },
    {
      title: 'Diagnósticos',
      fields: ['diagnoses']
    },
    {
      title: 'Fórmula de Medicamentos ordenados al egreso de la Urgencias / Atención inmediata',
      fields: ['dischargeMedications']
    },
    {
      title: 'Ordenes médicas - Procedimientos ordenados al egreso de la Urgencias / Atención Inmediata',
      fields: ['dischargeProcedures']
    },
    {
      title: 'Ordenes médicas - Otras tecnologías en salud ordenadas al egreso de la Urgencias / Atención Inmediata',
      fields: ['dischargeTechnologies']
    },
    {
      title: 'Datos incapacidad',
      fields: ['incapacity']
    },
    {
      title: 'Profesional de salud que dio el alta de la Urgencias / Atención Inmediata',
      fields: ['dischargeProfessional']
    },
    {
      title: 'Documento de soporte de la Urgencias / Atención Inmediata',
      fields: ['supportDocuments']
    }
  ]
};

const RDA_FIELD_LABELS = {
  providerName: 'Prestador',
  providerCity: 'Municipio',
  payerName: 'Entidad responsable',
  patientName: 'Nombre completo',
  patientDocument: 'Documento',
  patientSex: 'Sexo',
  patientBirthDate: 'Fecha de nacimiento',
  patientAgeLabel: 'Edad',
  attentionDate: 'Fecha de atención',
  careType: 'Tipo de RDA',
  mainDiagnosis: 'Diagnóstico principal',
  mainProcedure: 'Procedimiento principal',
  clinicalSummary: 'Resumen clínico',
  healthBackground: 'Antecedentes',
  allergies: 'Alergias',
  historicalMedications: 'Medicamentos como antecedente',
  diagnoses: 'Diagnósticos',
  orderedMedications: 'Medicamentos ordenados',
  orderedProcedures: 'Procedimientos ordenados',
  performedProcedures: 'Procedimientos realizados',
  administeredMedications: 'Medicamentos administrados',
  administeredTechnologies: 'Otras tecnologías administradas',
  dischargeMedications: 'Medicamentos al egreso',
  dischargeProcedures: 'Procedimientos al egreso',
  dischargeTechnologies: 'Otras tecnologías al egreso',
  incapacity: 'Incapacidad',
  dischargeProfessional: 'Profesional de alta',
  supportDocuments: 'Documentos de soporte',
  serviceProfessional: 'Profesional de salud'
};

module.exports = {
  OFFICIAL_RDA_TYPES,
  RDA_TYPE_LABELS,
  DETAIL_GROUPS_BY_TYPE,
  RDA_FIELD_LABELS,
  normalizeRdaType
};
