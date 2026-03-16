export function renderFilters(container, options, defaultFilters, callbacks) {
  const typeOptions = options.types.map((type) => `<option value="${type}">${type}</option>`).join('');
  const entityOptions = options.entities.map((entity) => `<option value="${entity}">${entity}</option>`).join('');

  container.innerHTML = `
    <h3>Filtros clínicos</h3>
    <form id="filters-form">
      <div class="filters-grid">
        <label>Fecha desde<input type="date" name="fromDate" value="${defaultFilters.fromDate}" /></label>
        <label>Fecha hasta<input type="date" name="toDate" value="${defaultFilters.toDate}" /></label>
        <label>Tipo RDA
          <select name="rdaType"><option value="">Todos</option>${typeOptions}</select>
        </label>
        <label>Entidad
          <select name="entity"><option value="">Todas</option>${entityOptions}</select>
        </label>
        <label>Procedimiento<input type="text" name="procedure" value="${defaultFilters.procedure}" /></label>
        <label>Texto libre<input type="search" name="searchText" value="${defaultFilters.searchText}" placeholder="Diagnóstico, observación, profesional..." /></label>
      </div>
      <div class="filter-actions">
        <button type="submit">Buscar</button>
        <button type="button" class="secondary" id="clear-filters">Limpiar filtros</button>
      </div>
    </form>
  `;

  const form = container.querySelector('#filters-form');
  form.elements.rdaType.value = defaultFilters.rdaType || '';
  form.elements.entity.value = defaultFilters.entity || '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    callbacks.onSearch({
      fromDate: data.get('fromDate')?.toString() || '',
      toDate: data.get('toDate')?.toString() || '',
      rdaType: data.get('rdaType')?.toString() || '',
      entity: data.get('entity')?.toString() || '',
      procedure: data.get('procedure')?.toString() || '',
      searchText: data.get('searchText')?.toString() || ''
    });
  });

  container.querySelector('#clear-filters').addEventListener('click', () => callbacks.onClear());
}
