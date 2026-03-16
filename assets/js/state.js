const state = {
  mode: 'standalone',
  patient: null,
  allRdas: [],
  filteredRdas: [],
  selectedRdaId: null,
  filters: {
    fromDate: '',
    toDate: '',
    rdaType: '',
    entity: '',
    procedure: '',
    searchText: ''
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
    rdaType: '',
    entity: '',
    procedure: '',
    searchText: ''
  };
}
