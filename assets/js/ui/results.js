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
      <tr class="history-row" data-code="${escapeHtml(rda.recordCode)}">
        <td>${escapeHtml(rda.attentionDate)}</td>
        <td>${escapeHtml(rda.typeLabel || rda.type)}</td>
        <td>${escapeHtml(rda.entity)}</td>
        <td>${escapeHtml(rda.municipio || 'No registrado')}</td>
      </tr>`
    )
    .join('');

  container.innerHTML = `
    <div class="results-head">
      <div>
        <h3>Historial de atenciones en salud</h3>
        <p class="text-muted">Seleccione un registro para ver el detalle clínico.</p>
      </div>
      <span class="tag">${(rdas || []).length} registros</span>
    </div>
    <div class="results-table-wrap">
      <table class="results-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo RDA</th>
            <th>Institución</th>
            <th>Municipio</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="4" class="text-muted results-empty">Sin resultados para el paciente</td></tr>'}</tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.history-row').forEach((row) => {
    row.addEventListener('click', () => onSelect(row.dataset.code));
  });
}
