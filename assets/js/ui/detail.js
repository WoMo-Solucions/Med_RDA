import { renderDetailBlocks } from './detail-renderer.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderDetail(container, rda, options = {}) {
  if (!rda) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <section class="detail-inline-shell">
      <div class="detail-inline-head">
        <div class="detail-inline-title">
          <h3>${escapeHtml(rda.typeLabel || rda.type)}</h3>
          <p class="text-muted">Registro ${escapeHtml(rda.recordCode)}</p>
        </div>
        <div class="detail-nav-bar" aria-label="Navegación de detalle">
          <button type="button" class="detail-nav-btn" data-detail-nav="previous" title="Atrás" aria-label="Atrás" ${
            options.hasPrevious ? '' : 'disabled'
          }>←</button>
          <button type="button" class="detail-nav-btn detail-nav-btn-close" data-detail-nav="close" title="Volver" aria-label="Volver">×</button>
          <button type="button" class="detail-nav-btn" data-detail-nav="next" title="Siguiente" aria-label="Siguiente" ${
            options.hasNext ? '' : 'disabled'
          }>→</button>
        </div>
      </div>
      <article class="detail-inline-body"></article>
    </section>
  `;

  renderDetailBlocks(container.querySelector('.detail-inline-body'), rda);

  container.querySelector('[data-detail-nav="previous"]')?.addEventListener('click', options.onPrevious || (() => {}));
  container.querySelector('[data-detail-nav="next"]')?.addEventListener('click', options.onNext || (() => {}));
  container.querySelector('[data-detail-nav="close"]')?.addEventListener('click', options.onClose || (() => {}));
}
