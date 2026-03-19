function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderResults(container, rdas, options) {
  const { onSelect, detailView = 'popup', onDetailViewChange } = options;
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
        <p class="results-subtitle">Seleccione un RDA para ver únicamente su detalle.</p>
      </div>
      <div class="results-head-actions">
        <label class="view-mode-toggle">
          <input id="detail-view-toggle" type="checkbox" ${detailView === 'page' ? 'checked' : ''} />
          <span class="view-mode-slider"></span>
          <span class="view-mode-label">Abrir en página</span>
        </label>
        <span class="tag">${(rdas || []).length} registros</span>
      </div>
    </div>
    <table class="results-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo RDA</th>
          <th>Institución</th>
          <th>Municipio</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="4" class="text-muted">Sin resultados para el paciente.</td></tr>'}</tbody>
    </table>
  `;

  container.querySelectorAll('.history-row').forEach((row) => {
    row.addEventListener('click', () => onSelect(row.dataset.code));
  });

  container.querySelector('#detail-view-toggle')?.addEventListener('change', (event) => {
    onDetailViewChange(event.currentTarget.checked ? 'page' : 'popup');
  });
}
