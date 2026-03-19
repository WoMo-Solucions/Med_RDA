import { RDA_FIELD_LABELS } from '../rda-schema.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderValueContent(value) {
  if (Array.isArray(value)) {
    if (!value.length) return '<div class="value-empty">Sin datos para este bloque.</div>';
    return `
      <div class="value-stack">
        ${value.map((item) => `<div class="value-stack-item">${escapeHtml(item)}</div>`).join('')}
      </div>
    `;
  }

  if (!String(value || '').trim()) {
    return '<div class="value-empty">Sin datos para este bloque.</div>';
  }

  return `<div class="value-text">${escapeHtml(value)}</div>`;
}

function renderField(field) {
  return `
    <section class="field-card">
      <div class="field-label">${escapeHtml(RDA_FIELD_LABELS[field.key] || field.key)}</div>
      <div class="value-box">${renderValueContent(field.value)}</div>
    </section>
  `;
}

function renderGroupContent(container, group) {
  container.innerHTML = group.fields.length
    ? `<div class="detail-grid">${group.fields.map(renderField).join('')}</div>`
    : '<div class="empty-group-state">Sin datos reportados para este bloque.</div>';
}

export function renderDetailTabs(container, rda) {
  const groups = rda.groups || [];
  container.innerHTML = `
    <div class="detail-header-card">
      <div>
        <p class="detail-eyebrow">Detalle RDA</p>
        <h3>${escapeHtml(rda.typeLabel || rda.type)} · ${escapeHtml(rda.recordCode)}</h3>
      </div>
      <p class="text-muted">${escapeHtml(rda.attentionDate || '')}</p>
    </div>
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
  if (!groups.length) {
    contentArea.innerHTML = '<div class="empty-group-state">No hay bloques configurados para este RDA.</div>';
    return;
  }

  renderGroupContent(contentArea, groups[0]);
  container.querySelectorAll('.tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.tabIndex || 0);
      container.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.remove('active'));
      button.classList.add('active');
      renderGroupContent(contentArea, groups[index] || groups[0]);
    });
  });
}
