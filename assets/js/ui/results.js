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
      <h3>Historial de atenciones en salud</h3>
      <span class="tag">${(rdas || []).length} registros</span>
    </div>
    <table class="results-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo RDA</th>
          <th>Institucion</th>
          <th>Municipio</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="4" class="text-muted">Sin resultados para el paciente.</td></tr>'}</tbody>
    </table>
  `;

  container.querySelectorAll('.history-row').forEach((row) => {
    row.addEventListener('click', () => onSelect(row.dataset.code));
  });
}
