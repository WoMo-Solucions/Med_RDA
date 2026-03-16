function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function listOrEmpty(items, renderer) {
  if (!items?.length) return '<li class="text-muted">No registrado.</li>';
  return items.map(renderer).join('');
}

export function renderDetail(container, rda) {
  if (!rda) {
    container.innerHTML = '<h3>Detalle RDA</h3><p class="text-muted">Seleccione una atención para visualizar su composición clínica.</p>';
    return;
  }

  container.innerHTML = `
    <h3>Detalle RDA - ${escapeHtml(rda.recordCode)}</h3>
    <p><strong>Resumen:</strong> ${escapeHtml(rda.clinicalSummary || 'Sin resumen clínico.')}</p>
    <div class="detail-list">
      <div><strong>Entidad:</strong> ${escapeHtml(rda.entity || 'N/A')}</div>
      <div><strong>Fecha:</strong> ${escapeHtml(rda.attentionDate || 'N/A')}</div>
      <div><strong>Servicio/Profesional:</strong> ${escapeHtml(rda.serviceProfessional || 'N/A')}</div>
      <div><strong>Diagnósticos</strong><ul>${listOrEmpty(rda.diagnoses, (d) => `<li>${escapeHtml(d.code)} - ${escapeHtml(d.description)}</li>`)}</ul></div>
      <div><strong>Procedimientos</strong><ul>${listOrEmpty(rda.procedures, (p) => `<li>${escapeHtml(p.code)} - ${escapeHtml(p.description)}</li>`)}</ul></div>
      <div><strong>Medicamentos</strong><ul>${listOrEmpty(rda.medications, (m) => `<li>${escapeHtml(m.name)} (${escapeHtml(m.dosage || 'N/A')})</li>`)}</ul></div>
      <div><strong>Observaciones</strong><ul>${listOrEmpty(rda.observations, (o) => `<li>${escapeHtml(o.note)}</li>`)}</ul></div>
      <div><strong>Anexos</strong><ul>${listOrEmpty(rda.documents, (d) => `<li>${escapeHtml(d.name)} - ${escapeHtml(d.reference)}</li>`)}</ul></div>
      <div><strong>Línea de tiempo</strong><ul>${listOrEmpty(rda.timeline, (t) => `<li>${escapeHtml(t.time)} - ${escapeHtml(t.event)}</li>`)}</ul></div>
    </div>
  `;
}
