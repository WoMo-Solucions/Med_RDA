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

export function renderFilters(container, config) {
  const { documentTypes, currentContext, defaultFilters, onConsult, onLogout } = config;
  const documentTypeOptions = documentTypes
    .map(
      (item) =>
        `<option value="${escapeHtml(item.code)}" ${item.code === currentContext.documentType ? 'selected' : ''}>${escapeHtml(item.label)}</option>`
    )
    .join('');

  const sortedTypes = ['RDA_PACIENTE', 'RDA_CONSULTA_EXTERNA', 'RDA_HOSPITALIZACION', 'RDA_URGENCIAS'];
  const typeOptions = sortedTypes
    .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(LABELS[type] || type)}</option>`)
    .join('');

  container.innerHTML = `
    <div class="sidebar-card">
      <div class="sidebar-card-head">
        <h3>Filtros</h3>
        <p class="text-muted">Consulte y refine el historial clínico del paciente.</p>
      </div>
      <form id="sidebar-search-form" class="sidebar-form">
        <label>Tipo de documento
          <select name="documentType" required>${documentTypeOptions}</select>
        </label>
        <label>Número de documento
          <input name="documentNumber" type="text" value="${escapeHtml(currentContext.documentNumber)}" required />
        </label>
        <label>Tipo RDA
          <select name="rdaType"><option value="">Todos</option>${typeOptions}</select>
        </label>
        <label>Fecha desde<input type="date" name="fromDate" value="${escapeHtml(defaultFilters.fromDate)}" /></label>
        <label>Fecha hasta<input type="date" name="toDate" value="${escapeHtml(defaultFilters.toDate)}" /></label>
        <button type="submit">Consultar</button>
        <button type="button" class="secondary danger-action" id="logout-btn">Cerrar sesión</button>
      </form>
    </div>
  `;

  const form = container.querySelector('#sidebar-search-form');
  form.elements.rdaType.value = defaultFilters.rdaType || '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    onConsult({
      context: {
        documentType: data.get('documentType')?.toString() || '',
        documentNumber: data.get('documentNumber')?.toString() || ''
      },
      filters: {
        rdaType: data.get('rdaType')?.toString() || '',
        fromDate: data.get('fromDate')?.toString() || '',
        toDate: data.get('toDate')?.toString() || ''
      }
    });
  });

  container.querySelector('#logout-btn').addEventListener('click', onLogout);
}
