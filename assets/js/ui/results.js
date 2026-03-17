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
        <td>${escapeHtml(rda.typeLabel || rda.type)}</td>
        <td>${escapeHtml(rda.entity)}</td>
        <td>${escapeHtml(rda.serviceProfessional)}</td>
        <td>${escapeHtml(rda.mainDiagnosis)}</td>
        <td>${escapeHtml(rda.mainProcedure)}</td>
        <td>${escapeHtml(rda.documentClass || 'N/A')}</td>
        <td><button type="button" data-code="${escapeHtml(rda.recordCode)}" class="secondary btn-detail">Visualizar</button></td>
      </tr>`
    )
    .join('');

  container.innerHTML = `
    <div class="results-head">
      <h3>Listado de atenciones RDA</h3>
      <span class="tag">${(rdas || []).length} registros</span>
    </div>
    <table class="results-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo RDA</th>
          <th>Entidad</th>
          <th>Servicio / Ámbito</th>
          <th>Diagnóstico</th>
          <th>Procedimiento</th>
          <th>Clase documental</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="8" class="text-muted">Sin resultados para el paciente.</td></tr>'}</tbody>
    </table>
  `;

  container.querySelectorAll('.btn-detail').forEach((button) => {
    button.addEventListener('click', () => onSelect(button.dataset.code));
  });
}
