const API_BASE = '/api';

async function apiRequest(path, payload, method = 'POST') {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(payload || {})
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }
  return data.data;
}

export async function login(username, password) {
  return apiRequest('/auth/login', { username, password });
}

export async function checkSession() {
  return apiRequest('/auth/session', null, 'GET');
}

export async function logout() {
  return apiRequest('/auth/logout');
}

export async function loadDocumentTypes() {
  return apiRequest('/document-types', null, 'GET');
}

export async function getPatientContext(context) {
  return apiRequest('/query-patient', {
    documentType: context.documentType,
    documentNumber: context.documentNumber
  });
}

export async function loadPatientRdas(patientContext, filters = {}) {
  return apiRequest('/patient-rda', {
    documentType: patientContext.documentType,
    documentNumber: patientContext.documentNumber,
    rdaType: filters.rdaType || '',
    fromDate: filters.fromDate || '',
    toDate: filters.toDate || ''
  });
}

export async function loadCompositionDocument(recordCode) {
  return apiRequest('/composition-document', { recordCode });
}

export async function loadFhirSummary(patientContext) {
  return apiRequest('/fhir-summary', {
    documentType: patientContext.documentType,
    documentNumber: patientContext.documentNumber
  });
}

export function clearFilters() {
  return { fromDate: '', toDate: '', rdaType: '' };
}
