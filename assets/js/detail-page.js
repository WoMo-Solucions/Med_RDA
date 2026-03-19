import { checkSession, loadCompositionDocument } from './api.js';
import { renderDetailBlocks } from './ui/detail-renderer.js';

const content = document.getElementById('detail-page-content');
const backButton = document.getElementById('back-to-viewer');

backButton.addEventListener('click', () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = '/index.html';
});

async function boot() {
  try {
    await checkSession();
    const searchParams = new URLSearchParams(window.location.search);
    const recordCode = String(searchParams.get('recordCode') || '').trim();
    if (!recordCode) throw new Error('No se recibió el registro RDA.');
    const detail = await loadCompositionDocument(recordCode);
    renderDetailBlocks(content, detail);
  } catch (error) {
    content.innerHTML = `<p class="alert">${String(error.message || 'No fue posible cargar el detalle.')}</p>`;
  }
}

boot();
