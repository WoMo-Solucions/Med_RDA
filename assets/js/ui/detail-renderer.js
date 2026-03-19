import { RDA_FIELD_LABELS } from '../rda-schema.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isMeaningful(value) {
  if (Array.isArray(value)) return value.some(isMeaningful);
  if (value && typeof value === 'object') return Object.values(value).some(isMeaningful);
  return String(value ?? '').trim().length > 0;
}

function renderObjectRows(item) {
  const entries = Object.entries(item || {}).filter(([, value]) => isMeaningful(value));
  if (!entries.length) return '<p class="text-muted">No registrado.</p>';

  return entries
    .map(
      ([key, value]) => `
        <div class="collection-field-row">
          <span class="collection-field-label">${escapeHtml(RDA_FIELD_LABELS[key] || key)}</span>
          <span class="collection-field-value">${escapeHtml(String(value))}</span>
        </div>
      `
    )
    .join('');
}

function renderCollection(items) {
  if (!items.length) return '<p class="text-muted">No registrado.</p>';

  return `
    <div class="collection-list">
      ${items
        .map(
          (item) => `
            <article class="collection-item">
              ${renderObjectRows(item)}
            </article>
          `
        )
        .join('')}
    </div>
  `;
}

function renderField(field) {
  const value = field.value;
  if (Array.isArray(value)) {
    return `
      <div class="field-item field-item-collection">
        <label>${escapeHtml(RDA_FIELD_LABELS[field.key] || field.key)}</label>
        ${renderCollection(value)}
      </div>
    `;
  }

  if (value && typeof value === 'object') {
    return `
      <div class="field-item">
        <label>${escapeHtml(RDA_FIELD_LABELS[field.key] || field.key)}</label>
        <div class="value-box value-box-object">${renderObjectRows(value)}</div>
      </div>
    `;
  }

  return `
    <div class="field-item">
      <label>${escapeHtml(RDA_FIELD_LABELS[field.key] || field.key)}</label>
      <pre class="value-box">${escapeHtml(String(value || 'No registrado.'))}</pre>
    </div>
  `;
}

export function renderDetailTabs(container, rda) {
  renderDetailBlocks(container, rda);
}

export function renderDetailBlocks(container, rda) {
  const groups = rda.groups || [];
  container.innerHTML = `
    <div class="detail-page-title-wrap">
      <h1>${escapeHtml(rda.typeLabel || rda.type)}</h1>
      <p class="text-muted">Registro ${escapeHtml(rda.recordCode)}</p>
    </div>
    <div class="detail-page-groups">
      ${groups
        .map((group) => {
          const hasData = group.fields.some((field) => isMeaningful(field.value));
          return `
            <section class="detail-block">
              <h3>${escapeHtml(group.title)}</h3>
              ${hasData ? `<div class="detail-fields-grid">${group.fields.map(renderField).join('')}</div>` : '<p class="empty-subdivision">No registrado.</p>'}
            </section>
          `;
        })
        .join('')}
    </div>
  `;
}
