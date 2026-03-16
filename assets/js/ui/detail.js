function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderTagList(items) {
  if (!items?.length) return '<span class="text-muted">No registrado.</span>';
  return items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join('');
}

export function renderDetail(container, rda) {
  if (!rda) {
    container.innerHTML = '<h3>Detalle clínico</h3><p class="text-muted">Seleccione un RDA para visualizar detalle.</p>';
    return;
  }

  const docs = (rda.documents || [])
    .map((document) => `<li><strong>${escapeHtml(document.name)}:</strong> ${escapeHtml(document.reference)}</li>`)
    .join('') || '<li class="text-muted">Sin anexos.</li>';

  const timeline = (rda.timeline || [])
    .map((item) => `<li><strong>${escapeHtml(item.time)}</strong> - ${escapeHtml(item.event)}</li>`)
    .join('') || '<li class="text-muted">Sin eventos cronológicos.</li>';

  container.innerHTML = `
    <h3>Detalle clínico</h3>
    <p><strong>Resumen:</strong> ${escapeHtml(rda.clinicalSummary || 'Sin resumen clínico.')}</p>
    <div class="detail-list">
      <div><strong>Diagnósticos</strong><br/>${renderTagList(rda.diagnoses)}</div>
      <div><strong>Procedimientos</strong><br/>${renderTagList(rda.procedures)}</div>
      <div><strong>Medicamentos</strong><br/>${renderTagList(rda.medications)}</div>
      <div><strong>Observaciones</strong><br/>${renderTagList(rda.observations)}</div>
      <div><strong>Documentos / anexos</strong><ul>${docs}</ul></div>
      <div><strong>Línea de tiempo</strong><ul>${timeline}</ul></div>
    </div>
  `;
}
