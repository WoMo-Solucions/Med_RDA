function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const LABELS = {
  RDA_PACIENTE: 'Paciente',
  RDA_CONSULTA_EXTERNA: 'Consulta externa',
  RDA_HOSPITALIZACION: 'Hospitalización',
  RDA_URGENCIAS: 'Urgencias'
};

export function renderFilters(container, rdaTypes, defaultFilters, callbacks) {
  const sortedTypes = ['RDA_PACIENTE', 'RDA_CONSULTA_EXTERNA', 'RDA_HOSPITALIZACION', 'RDA_URGENCIAS'].filter((t) =>
    rdaTypes.includes(t)
  );
  const typeOptions = sortedTypes
    .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(LABELS[type] || type)}</option>`)
    .join('');

  container.innerHTML = `
    <h3>Filtros del paciente</h3>
    <form id="filters-form">
      <div class="filters-grid">
        <label>Tipo RDA
          <select name="rdaType"><option value="">Todos</option>${typeOptions}</select>
        </label>
        <label>Fecha desde<input type="date" name="fromDate" value="${escapeHtml(defaultFilters.fromDate)}" /></label>
        <label>Fecha hasta<input type="date" name="toDate" value="${escapeHtml(defaultFilters.toDate)}" /></label>
      </div>
      <div class="filter-actions">
        <button type="submit">Aplicar filtros</button>
        <button type="button" class="secondary" id="clear-filters">Limpiar</button>
      </div>
    </form>
  `;

  const form = container.querySelector('#filters-form');
  form.elements.rdaType.value = defaultFilters.rdaType || '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    callbacks.onSearch({
      rdaType: data.get('rdaType')?.toString() || '',
      fromDate: data.get('fromDate')?.toString() || '',
      toDate: data.get('toDate')?.toString() || ''
    });
  });

  container.querySelector('#clear-filters').addEventListener('click', callbacks.onClear);
}
