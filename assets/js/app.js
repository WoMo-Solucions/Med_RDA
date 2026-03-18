import { getState, resetFilters, updateFilters, updateState } from './state.js';
import {
  checkSession,
  clearFilters,
  getPatientContext,
  loadCompositionDocument,
  loadDocumentTypes,
  loadPatientRdas,
  login,
  logout
} from './api.js';
import { renderFilters } from './ui/filters.js';
import { closeDetailModal, renderDetail, showDetailModal } from './ui/detail.js';
import { renderResults } from './ui/results.js';
import {
  renderAuthForm,
  renderHeaderLogos,
  renderPatientHeader,
  renderPersistentSearch,
  setAuthVisibility,
  setViewerVisibility,
  showAuthMessage,
  showIdentifyMessage
} from './ui/layout.js';

const authPanel = document.getElementById('auth-panel');
const logosHeader = document.getElementById('logos-header');
const searchPanel = document.getElementById('search-panel');
const patientHeader = document.getElementById('patient-header');
const filtersPanel = document.getElementById('filters-panel');
const resultsPanel = document.getElementById('results-panel');
const detailPanel = document.getElementById('detail-panel');
const detailModal = document.getElementById('detail-modal');

document.getElementById('modal-close').addEventListener('click', closeDetailModal);
detailModal.addEventListener('click', (event) => {
  if (event.target.id === 'detail-modal') closeDetailModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDetailModal();
});

function getRdaTypes(rdas) {
  return [...new Set((rdas || []).map((item) => item.type).filter(Boolean))];
}

function renderBaseViewer() {
  const state = getState();
  renderHeaderLogos(logosHeader);
  renderPersistentSearch(
    searchPanel,
    state.documentTypes,
    state.patient || { documentType: state.documentTypes[0]?.code || '', documentNumber: '' },
    async (payload) => {
      await loadPatientFlow(payload, false);
    },
    doLogout
  );
  renderPatientHeader(patientHeader, state.patient);
  renderFilters(filtersPanel, getRdaTypes(state.allRdas), state.filters, {
    onSearch: async (newFilters) => {
      updateFilters(newFilters);
      const current = getState().patient;
      if (!current) return;
      await loadPatientFlow(current, true);
    },
    onClear: async () => {
      resetFilters();
      updateFilters(clearFilters());
      const current = getState().patient;
      if (!current) return;
      await loadPatientFlow(current, true);
    }
  });
  renderResults(resultsPanel, state.allRdas, async (recordCode) => {
    const detail = await loadCompositionDocument(recordCode);
    updateState({ selectedRda: detail });
    renderDetail(detailPanel, detail);
    showDetailModal();
  });
}

async function loadPatientFlow(context, applyCurrentFilters = false) {
  try {
    const patient = await getPatientContext(context);
    const state = getState();
    const filters = applyCurrentFilters ? state.filters : clearFilters();
    if (!applyCurrentFilters) {
      resetFilters();
      updateFilters(filters);
    }

    const { rdas } = await loadPatientRdas(patient, filters);
    updateState({ patient, allRdas: rdas, selectedRda: null });
    renderBaseViewer();
    showIdentifyMessage('');
  } catch (error) {
    updateState({ allRdas: [], selectedRda: null });
    renderBaseViewer();
    showIdentifyMessage(error.message || 'Error en la consulta.', true);
  }
}

async function doLogout() {
  await logout();
  updateState({ patient: null, allRdas: [], selectedRda: null });
  setViewerVisibility(false);
  setAuthVisibility(false);
  closeDetailModal();
  showAuthMessage('Sesión cerrada correctamente.');
}

async function bootViewer() {
  const documentTypes = await loadDocumentTypes();
  updateState({ documentTypes, patient: null, allRdas: [], selectedRda: null });
  setViewerVisibility(true);
  renderBaseViewer();
}

async function boot() {
  renderAuthForm(authPanel, async ({ username, password }) => {
    try {
      await login(username, password);
      setAuthVisibility(true);
      showAuthMessage('');
      await bootViewer();
    } catch (error) {
      showAuthMessage(error.message || 'No fue posible iniciar sesión.', true);
    }
  });

  try {
    await checkSession();
    setAuthVisibility(true);
    await bootViewer();
  } catch (error) {
    setAuthVisibility(false);
    setViewerVisibility(false);
  }
}

boot().catch(() => {
  showAuthMessage('Error de inicialización del visor.', true);
});
