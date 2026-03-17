import { RDA_FIELD_LABELS } from '../rda-schema.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderFieldValue(field) {
  if (!Array.isArray(field.value)) {
    return escapeHtml(field.value || 'No registrado.');
  }

  if (!field.value.length) {
    return '<li class="text-muted">No registrado.</li>';
  }

  return field.value
    .map((item) => {
      if (field.key === 'diagnoses' || field.key === 'procedures') {
        return `<li>${escapeHtml(item.code)} - ${escapeHtml(item.description)}</li>`;
      }
      if (field.key === 'medications') {
        return `<li>${escapeHtml(item.name)} (${escapeHtml(item.dosage || 'N/A')})</li>`;
      }
      if (field.key === 'observations') {
        return `<li>${escapeHtml(item.note)}</li>`;
      }
      if (field.key === 'documents') {
        return `<li>${escapeHtml(item.name)} - ${escapeHtml(item.reference)}</li>`;
      }
      if (field.key === 'timeline') {
        return `<li>${escapeHtml(item.time)} - ${escapeHtml(item.event)}</li>`;
      }
      return `<li>${escapeHtml(JSON.stringify(item))}</li>`;
    })
    .join('');
}

export function showDetailModal() {
  document.getElementById('detail-modal').classList.remove('hidden');
}

export function closeDetailModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}

export function renderDetail(container, rda) {
  if (!rda) {
    container.innerHTML = '<h3>Detalle RDA</h3><p class="text-muted">Seleccione una atención para visualizar su composición clínica.</p>';
    return;
  }

  const groups = (rda.groups || []).map((group) => `
    <section class="detail-group">
      <h4>${escapeHtml(group.title)}</h4>
      ${group.fields
        .map((field) => `
        <div><strong>${escapeHtml(RDA_FIELD_LABELS[field.key] || field.key)}</strong><ul>${renderFieldValue(field)}</ul></div>
      `)
        .join('')}
    </section>
  `);

  container.innerHTML = `
    <h3>${escapeHtml(rda.typeLabel || rda.type)} - ${escapeHtml(rda.recordCode)}</h3>
    ${groups.join('')}
  `;
}
