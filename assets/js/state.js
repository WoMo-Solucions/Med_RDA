const DETAIL_OPEN_MODE_KEY = 'med_rda_detail_open_mode';

const state = {
  mode: 'standalone',
  patient: null,
  documentTypes: [],
  allRdas: [],
  selectedRda: null,
  detailOpenMode: window.localStorage.getItem(DETAIL_OPEN_MODE_KEY) || 'modal',
  filters: {
    fromDate: '',
    toDate: '',
    rdaType: ''
  }
};

export function getState() {
  return state;
}

export function updateState(partialState) {
  Object.assign(state, partialState);
}

export function updateFilters(nextFilters) {
  state.filters = { ...state.filters, ...nextFilters };
}

export function resetFilters() {
  state.filters = {
    fromDate: '',
    toDate: '',
    rdaType: ''
  };
}

export function setDetailOpenMode(mode) {
  state.detailOpenMode = mode;
  window.localStorage.setItem(DETAIL_OPEN_MODE_KEY, mode);
}
