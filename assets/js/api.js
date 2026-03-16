const MOCK_FILE = './assets/data/mock-rda.json';

async function loadMockData() {
  const response = await fetch(MOCK_FILE);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el mock de RDA: ${response.status}`);
  }
  return response.json();
}

export async function loadPatientRdas(patientContext) {
  if (!patientContext?.documentType || !patientContext?.documentNumber) {
    throw new Error('Contexto de paciente incompleto.');
  }

  const data = await loadMockData();
  const patient = data.patients.find(
    (candidate) =>
      candidate.documentType === patientContext.documentType &&
      candidate.documentNumber === patientContext.documentNumber
  );

  if (!patient) {
    return { patient: null, rdas: [] };
  }

  return {
    patient,
    rdas: Array.isArray(patient.rdas) ? patient.rdas : []
  };
}

export function applyFilters(rdas, filters) {
  const safeRows = Array.isArray(rdas) ? rdas : [];
  const normalizedSearch = (filters.searchText || '').trim().toLowerCase();

  return safeRows.filter((item) => {
    const attentionDate = item.attentionDate || '';
    const matchesFrom = !filters.fromDate || attentionDate >= filters.fromDate;
    const matchesTo = !filters.toDate || attentionDate <= filters.toDate;
    const matchesType = !filters.rdaType || item.type === filters.rdaType;
    const matchesEntity = !filters.entity || item.entity === filters.entity;

    const mainProcedure = item.mainProcedure || '';
    const matchesProcedure =
      !filters.procedure || mainProcedure.toLowerCase().includes(filters.procedure.toLowerCase());

    const searchableText = [
      item.mainDiagnosis,
      item.mainProcedure,
      item.entity,
      item.serviceProfessional,
      ...(item.observations || []),
      item.clinicalSummary
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesText = !normalizedSearch || searchableText.includes(normalizedSearch);

    return matchesFrom && matchesTo && matchesType && matchesEntity && matchesProcedure && matchesText;
  });
}

export function clearFilters() {
  return {
    fromDate: '',
    toDate: '',
    rdaType: '',
    entity: '',
    procedure: '',
    searchText: ''
  };
}
