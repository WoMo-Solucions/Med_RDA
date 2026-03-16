import { MODES, getRuntimeMode } from './config.js';
import { getState, resetFilters, updateFilters, updateState } from './state.js';
import {
  clearFilters,
  getPatientContext,
  loadCompositionDocument,
  loadDocumentTypes,
  loadFhirSummary,
  loadPatientRdas
} from './api.js';
import { getPatientContext as getSapPatientContext } from './adapters/sap-adapter.js';
import { getPatientContext as getStandaloneContext } from './adapters/standalone-adapter.js';
import { renderFilters } from './ui/filters.js';
import { renderDetail } from './ui/detail.js';
import { renderResults } from './ui/results.js';
import {
  renderIdentifyForm,
  renderPatientHeader,
  renderPersistentSearch,
  setViewerVisibility,
  showIdentifyMessage
} from './ui/layout.js';

const identifyPanel = document.getElementById('identify-panel');
const searchPanel = document.getElementById('search-panel');
const patientHeader = document.getElementById('patient-header');
const filtersPanel = document.getElementById('filters-panel');
const resultsPanel = document.getElementById('results-panel');
const detailPanel = document.getElementById('detail-panel');

function getRdaTypes(rdas) {
  return [...new Set((rdas || []).map((item) => item.type).filter(Boolean))];
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
    const { summary } = await loadFhirSummary(patient);

    updateState({ patient, allRdas: rdas, selectedRda: null });
    setViewerVisibility(true);
    showIdentifyMessage('');

    renderPersistentSearch(searchPanel, state.documentTypes, patient, async (payload) => {
      const nextContext = getStandaloneContext(payload);
      await loadPatientFlow(nextContext, false);
    });

    renderPatientHeader(patientHeader, patient, summary);
    renderFilters(filtersPanel, getRdaTypes(rdas), getState().filters, {
      onSearch: async (newFilters) => {
        updateFilters(newFilters);
        await loadPatientFlow(patient, true);
      },
      onClear: async () => {
        resetFilters();
        updateFilters(clearFilters());
        await loadPatientFlow(patient, true);
      }
    });

    renderResults(resultsPanel, rdas, async (recordCode) => {
      const detail = await loadCompositionDocument(recordCode);
      updateState({ selectedRda: detail });
      renderDetail(detailPanel, detail);
    });

    renderDetail(detailPanel, null);
  } catch (error) {
    console.error(error);
    showIdentifyMessage(error.message || 'Error en la consulta.', true);
  }
}

function initStandalone() {
  const state = getState();
  renderIdentifyForm(identifyPanel, state.documentTypes, async (formValues) => {
    const context = getStandaloneContext(formValues);
    await loadPatientFlow(context, false);
  });
  setViewerVisibility(false);
}

async function initSap() {
  const searchParams = new URLSearchParams(window.location.search);
  const context = getSapPatientContext(searchParams);
  if (!context) {
    initStandalone();
    showIdentifyMessage('Modo SAP sin contexto válido.', true);
    return;
  }
  await loadPatientFlow(context, false);
}

async function boot() {
  const searchParams = new URLSearchParams(window.location.search);
  const hasSapContext = Boolean(window.SAP_CONTEXT);
  const mode = getRuntimeMode(searchParams, hasSapContext);

  const documentTypes = await loadDocumentTypes();
  updateState({ mode, documentTypes });

  if (mode === MODES.SAP) {
    await initSap();
  } else {
    initStandalone();
  }
}

boot().catch((error) => {
  console.error(error);
  showIdentifyMessage('Error de inicialización del visor.', true);
});
