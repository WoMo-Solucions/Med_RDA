import { MODES, getRuntimeMode } from './config.js';
import { getState, resetFilters, updateFilters, updateState } from './state.js';
import { applyFilters, clearFilters, loadPatientRdas } from './api.js';
import { getPatientContext as getSapPatientContext } from './adapters/sap-adapter.js';
import { getPatientContext as getStandaloneContext } from './adapters/standalone-adapter.js';
import { renderFilters } from './ui/filters.js';
import { renderDetail } from './ui/detail.js';
import { renderResults } from './ui/results.js';
import {
  renderIdentifyForm,
  renderPatientHeader,
  setViewerVisibility,
  showIdentifyMessage
} from './ui/layout.js';

const identifyPanel = document.getElementById('identify-panel');
const patientHeader = document.getElementById('patient-header');
const filtersPanel = document.getElementById('filters-panel');
const resultsPanel = document.getElementById('results-panel');
const detailPanel = document.getElementById('detail-panel');

function getFilterOptions(rdas) {
  return {
    types: [...new Set(rdas.map((item) => item.type).filter(Boolean))],
    entities: [...new Set(rdas.map((item) => item.entity).filter(Boolean))]
  };
}

function syncMainView() {
  const state = getState();
  renderPatientHeader(patientHeader, state.patient);

  renderFilters(filtersPanel, getFilterOptions(state.allRdas), state.filters, {
    onSearch: (filters) => {
      updateFilters(filters);
      const current = getState();
      const filtered = applyFilters(current.allRdas, current.filters);
      updateState({ filteredRdas: filtered, selectedRdaId: filtered[0]?.id || null });
      syncResultAndDetail();
    },
    onClear: () => {
      resetFilters();
      const initialFilters = clearFilters();
      updateFilters(initialFilters);
      const current = getState();
      updateState({ filteredRdas: [...current.allRdas], selectedRdaId: current.allRdas[0]?.id || null });
      syncMainView();
    }
  });

  syncResultAndDetail();
}

function syncResultAndDetail() {
  const state = getState();
  renderResults(resultsPanel, state.filteredRdas, (id) => {
    updateState({ selectedRdaId: id });
    syncResultAndDetail();
  });

  const selected = state.filteredRdas.find((item) => item.id === state.selectedRdaId) || null;
  renderDetail(detailPanel, selected);
}

async function loadAndRender(patientContext) {
  try {
    const { patient, rdas } = await loadPatientRdas(patientContext);
    if (!patient) {
      showIdentifyMessage('Paciente no encontrado en mock local.', true);
      return;
    }

    updateState({
      patient,
      allRdas: rdas,
      filteredRdas: [...rdas],
      selectedRdaId: rdas[0]?.id || null
    });

    setViewerVisibility(true);
    syncMainView();
  } catch (error) {
    console.error(error);
    showIdentifyMessage('No fue posible consultar RDA. Revise la consola.', true);
  }
}

function initStandalone() {
  renderIdentifyForm(identifyPanel, async (formValues) => {
    const patientContext = getStandaloneContext(formValues);
    await loadAndRender(patientContext);
  });
  setViewerVisibility(false);
}

async function initSap() {
  const searchParams = new URLSearchParams(window.location.search);
  const patientContext = getSapPatientContext(searchParams);
  if (!patientContext) {
    renderIdentifyForm(identifyPanel, async (formValues) => {
      const fallbackContext = getStandaloneContext(formValues);
      await loadAndRender(fallbackContext);
    });
    showIdentifyMessage('Modo SAP sin contexto válido. Use SAP_CONTEXT o query params.', true);
    setViewerVisibility(false);
    return;
  }

  setViewerVisibility(true);
  await loadAndRender(patientContext);
}

async function boot() {
  const hasSapContext = Boolean(window.SAP_CONTEXT);
  const searchParams = new URLSearchParams(window.location.search);
  const mode = getRuntimeMode(searchParams, hasSapContext);
  updateState({ mode });

  if (mode === MODES.SAP) {
    await initSap();
    return;
  }

  initStandalone();
}

boot();
