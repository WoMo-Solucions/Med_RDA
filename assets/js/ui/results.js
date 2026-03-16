function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderResults(container, rdas, onSelect) {
  const rows = (rdas || [])
    .map(
      (rda) => `
      <tr>
        <td>${escapeHtml(rda.attentionDate)}</td>
        <td>${escapeHtml(rda.type)}</td>
        <td>${escapeHtml(rda.entity)}</td>
        <td>${escapeHtml(rda.mainDiagnosis)}</td>
        <td>${escapeHtml(rda.mainProcedure)}</td>
        <td>${escapeHtml(rda.serviceProfessional)}</td>
        <td><button type="button" data-id="${escapeHtml(rda.id)}" class="secondary btn-detail">Ver detalle</button></td>
      </tr>`
    )
    .join('');

  container.innerHTML = `
    <div class="results-head">
      <h3>Resultados RDA</h3>
      <span class="tag">${(rdas || []).length} encontrados</span>
    </div>
    <div class="table-wrap">
      <table class="results-table">
        <thead>
          <tr>
            <th>Fecha atención</th>
            <th>Tipo RDA</th>
            <th>Entidad</th>
            <th>Diagnóstico principal</th>
            <th>Procedimiento principal</th>
            <th>Servicio / Profesional</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7" class="text-muted">Sin resultados para los filtros seleccionados.</td></tr>'}</tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.btn-detail').forEach((button) => {
    button.addEventListener('click', () => onSelect(button.dataset.id));
  });
}
