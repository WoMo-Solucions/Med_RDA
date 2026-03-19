const state = {
  mode: 'standalone',
  patient: null,
  documentTypes: [],
  allRdas: [],
  selectedRda: null,
  detailView: 'popup',
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
