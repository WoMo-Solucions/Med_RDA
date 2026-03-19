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
import { renderDetail } from './ui/detail.js';
import { renderResults } from './ui/results.js';
import {
  renderAuthForm,
  renderHeaderLogos,
  renderPatientHeader,
  setAuthVisibility,
  setViewerVisibility,
  showAuthMessage,
  showIdentifyMessage
} from './ui/layout.js';

const authPanel = document.getElementById('auth-panel');
const logosHeader = document.getElementById('logos-header');
const patientHeader = document.getElementById('patient-header');
const filtersPanel = document.getElementById('filters-panel');
const resultsPanel = document.getElementById('results-panel');
const detailPanel = document.getElementById('detail-panel');

function getRdaTypes(rdas) {
  return [...new Set((rdas || []).map((item) => item.type).filter(Boolean))];
}

function getDefaultSearchContext() {
  const state = getState();
  return {
    documentType: state.searchContext.documentType || state.documentTypes[0]?.code || '',
    documentNumber: state.searchContext.documentNumber || ''
  };
}

function getSelectedRdaIndex() {
  const state = getState();
  const code = state.selectedRda?.recordCode;
  if (!code) return -1;
  return state.allRdas.findIndex((item) => item.recordCode === code);
}

async function openSelectedDetail(recordCode) {
  try {
    const detail = await loadCompositionDocument(recordCode);
    updateState({ selectedRda: detail });
    renderBaseViewer();
    showIdentifyMessage('');
  } catch (error) {
    showIdentifyMessage(error.message || 'No fue posible cargar el detalle.', true);
  }
}

function closeInlineDetail() {
  updateState({ selectedRda: null });
  renderBaseViewer();
}

function renderBaseViewer() {
  const state = getState();
  const selectedIndex = getSelectedRdaIndex();
  const hasDetail = Boolean(state.selectedRda);

  renderHeaderLogos(logosHeader);
  renderPatientHeader(patientHeader, state.patient);
  renderFilters(filtersPanel, {
    documentTypes: state.documentTypes,
    currentContext: getDefaultSearchContext(),
    rdaTypes: getRdaTypes(state.allRdas),
    defaultFilters: state.filters,
    onConsult: async ({ context, filters }) => {
      await loadPatientFlow(context, filters);
    },
    onLogout: doLogout
  });

  resultsPanel.classList.toggle('hidden', hasDetail);
  detailPanel.classList.toggle('hidden', !hasDetail);

  if (!hasDetail) {
    renderResults(resultsPanel, state.allRdas, async (recordCode) => {
      await openSelectedDetail(recordCode);
    });
    detailPanel.innerHTML = '';
    return;
  }

  renderDetail(detailPanel, state.selectedRda, {
    hasPrevious: selectedIndex > 0,
    hasNext: selectedIndex > -1 && selectedIndex < state.allRdas.length - 1,
    onPrevious: async () => {
      if (selectedIndex > 0) {
        await openSelectedDetail(state.allRdas[selectedIndex - 1].recordCode);
      }
    },
    onNext: async () => {
      if (selectedIndex > -1 && selectedIndex < state.allRdas.length - 1) {
        await openSelectedDetail(state.allRdas[selectedIndex + 1].recordCode);
      }
    },
    onClose: closeInlineDetail
  });
}

async function loadPatientFlow(context, nextFilters = clearFilters()) {
  const normalizedContext = {
    documentType: String(context.documentType || '').trim(),
    documentNumber: String(context.documentNumber || '').trim()
  };

  try {
    updateState({ searchContext: normalizedContext });
    updateFilters(nextFilters);
    const patient = await getPatientContext(normalizedContext);
    const { rdas } = await loadPatientRdas(patient, nextFilters);
    updateState({ patient, allRdas: rdas, selectedRda: null });
    renderBaseViewer();
    showIdentifyMessage('');
  } catch (error) {
    updateState({ patient: null, allRdas: [], selectedRda: null, searchContext: normalizedContext });
    renderBaseViewer();
    showIdentifyMessage(error.message || 'Error en la consulta.', true);
  }
}

async function doLogout() {
  await logout();
  updateState({ patient: null, allRdas: [], selectedRda: null, searchContext: { documentType: '', documentNumber: '' } });
  resetFilters();
  setViewerVisibility(false);
  setAuthVisibility(false);
  showAuthMessage('Sesión cerrada correctamente.');
}

async function bootViewer() {
  const documentTypes = await loadDocumentTypes();
  updateState({
    documentTypes,
    patient: null,
    allRdas: [],
    selectedRda: null,
    searchContext: { documentType: documentTypes[0]?.code || '', documentNumber: '' }
  });
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
