import { renderDetailTabs } from './detail-renderer.js';

export function showDetailDrawer() {
  document.getElementById('detail-drawer').classList.add('open');
}

export function closeDetailDrawer() {
  document.getElementById('detail-drawer').classList.remove('open');
}

export function renderDetail(container, rda) {
  if (!rda) {
    container.innerHTML = '<h3>Detalle RDA</h3><p class="text-muted">Seleccione una atención para visualizar su composición clínica.</p>';
    return;
  }

  renderDetailTabs(container, rda);
}
