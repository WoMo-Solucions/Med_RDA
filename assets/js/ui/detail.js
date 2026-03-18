import { renderDetailTabs } from './detail-renderer.js';

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

  renderDetailTabs(container, rda);
}
