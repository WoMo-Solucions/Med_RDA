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
import { closeDetailDrawer, renderDetail, showDetailDrawer } from './ui/detail.js';
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
const filtersPanel = document.getElementById('filters-panel');
const resultsPanel = document.getElementById('results-panel');
const detailPanel = document.getElementById('detail-panel');
const detailDrawer = document.getElementById('detail-drawer');
const detailCloseButton = document.getElementById('detail-close');

function getRdaTypes(rdas) {
  return [...new Set((rdas || []).map((item) => item.type).filter(Boolean))];
}

function bindDetailCloseEvents() {
  detailCloseButton?.addEventListener('click', closeDetailDrawer);
  detailDrawer?.addEventListener('click', (event) => {
    if (event.target === detailDrawer) closeDetailDrawer();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDetailDrawer();
  });
}

function bindAuth() {
  renderAuthForm(authPanel, async ({ username, password }) => {
    try {
      await login(username, password);
<<<<<<< codex/finalize-system-implementation-and-hardening-016t2o
      await bootViewer();
      setAuthVisibility(true);
      showAuthMessage('');
    } catch (error) {
      setViewerVisibility(false);
      setAuthVisibility(false);
      bindAuth();
=======
      setAuthVisibility(true);
      showAuthMessage('');
      await bootViewer();
    } catch (error) {
>>>>>>> main
      showAuthMessage(error.message || 'No fue posible iniciar sesión.', true);
    }
  });
}

function openDetailPage(recordCode) {
  const { patient } = getState();
  const params = new URLSearchParams({
    recordCode,
    documentType: patient?.documentType || '',
    documentNumber: patient?.documentNumber || ''
  });
  window.location.assign(`./detail.html?${params.toString()}`);
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
  renderPatientHeader(resultsPanel, state.patient);
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
  renderResults(resultsPanel, state.allRdas, {
    detailView: state.detailView,
    onDetailViewChange: (detailView) => updateState({ detailView }),
    onSelect: async (recordCode) => {
      if (getState().detailView === 'page') {
        openDetailPage(recordCode);
        return;
      }
      const detail = await loadCompositionDocument(recordCode);
      updateState({ selectedRda: detail });
      renderDetail(detailPanel, detail);
      showDetailDrawer();
    }
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

    const { patient: normalizedPatient, rdas } = await loadPatientRdas(patient, filters);
    updateState({ patient: normalizedPatient || patient, allRdas: rdas, selectedRda: null });
    closeDetailDrawer();
    renderBaseViewer();
    showIdentifyMessage('');
  } catch (error) {
    updateState({ patient: applyCurrentFilters ? getState().patient : null, allRdas: [], selectedRda: null });
    closeDetailDrawer();
    renderBaseViewer();
    showIdentifyMessage(error.message || 'Error en la consulta.', true);
  }
}

async function doLogout() {
  try {
    await logout();
  } catch (_error) {
    // no-op: the local UI must still return to a clean login state
  }

  updateState({ patient: null, allRdas: [], selectedRda: null, detailView: 'popup' });
  resetFilters();
  closeDetailDrawer();
  setViewerVisibility(false);
  setAuthVisibility(false);
  bindAuth();
}

async function bootViewer() {
  const documentTypes = await loadDocumentTypes();
  updateState({ documentTypes, patient: null, allRdas: [], selectedRda: null });
  setViewerVisibility(true);
  closeDetailDrawer();
  renderBaseViewer();
}

async function boot() {
  bindDetailCloseEvents();
  bindAuth();

  try {
    await checkSession();
    setAuthVisibility(true);
    await bootViewer();
  } catch (_error) {
    setAuthVisibility(false);
    setViewerVisibility(false);
    bindAuth();
  }
}

boot().catch(() => {
  showAuthMessage('Error de inicialización del visor.', true);
});
