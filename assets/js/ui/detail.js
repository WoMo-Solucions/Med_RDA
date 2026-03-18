import { RDA_FIELD_LABELS } from '../rda-schema.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stringifyFieldValue(field) {
  if (!Array.isArray(field.value)) {
    return String(field.value || 'No registrado.');
  }
  if (!field.value.length) return 'No registrado.';

  if (field.key === 'diagnoses' || field.key === 'procedures') {
    return field.value.map((item) => `${item.code} - ${item.description}`).join('\n');
  }
  if (field.key === 'medications') {
    return field.value.map((item) => `${item.name} (${item.dosage || 'N/A'})`).join('\n');
  }
  if (field.key === 'observations') {
    return field.value.map((item) => item.note).join('\n');
  }
  if (field.key === 'documents') {
    return field.value.map((item) => `${item.name} - ${item.reference}`).join('\n');
  }
  if (field.key === 'timeline') {
    return field.value.map((item) => `${item.time} - ${item.event}`).join('\n');
  }
  return field.value.map((item) => JSON.stringify(item)).join('\n');
}

function renderActiveTab(container, groups, tabIndex) {
  const activeGroup = groups[tabIndex] || groups[0];
  const fieldsHtml = activeGroup.fields
    .map((field) => {
      const value = stringifyFieldValue(field);
      return `
        <div class="field-item">
          <label>${escapeHtml(RDA_FIELD_LABELS[field.key] || field.key)}</label>
          <pre class="value-box">${escapeHtml(value)}</pre>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="tab-content-grid">${fieldsHtml}</div>
  `;
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

  const groups = rda.groups || [];
  container.innerHTML = `
    <h3>${escapeHtml(rda.typeLabel || rda.type)} - ${escapeHtml(rda.recordCode)}</h3>
    <div class="tabs-bar">
      ${groups
        .map(
          (group, index) =>
            `<button type="button" class="tab-btn ${index === 0 ? 'active' : ''}" data-tab-index="${index}">${escapeHtml(group.title)}</button>`
        )
        .join('')}
    </div>
    <section id="tab-content-area"></section>
  `;

  const contentArea = container.querySelector('#tab-content-area');
  renderActiveTab(contentArea, groups, 0);

  container.querySelectorAll('.tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.tabIndex || 0);
      container.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.remove('active'));
      button.classList.add('active');
      renderActiveTab(contentArea, groups, index);
    });
  });
}
