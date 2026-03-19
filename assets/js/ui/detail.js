import { renderDetailTabs } from './detail-renderer.js';

export function showDetailDrawer() {
  const drawer = document.getElementById('detail-drawer');
  drawer?.classList.add('open');
  drawer?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open');
}

export function closeDetailDrawer() {
  const drawer = document.getElementById('detail-drawer');
  drawer?.classList.remove('open');
  drawer?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('drawer-open');
}

export function renderDetail(container, rda) {
  if (!container) return;
  if (!rda) {
    container.innerHTML = '<div class="empty-group-state">Seleccione un RDA para visualizar su detalle.</div>';
    return;
  }

  renderDetailTabs(container, rda);
}
