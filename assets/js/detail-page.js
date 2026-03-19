import { checkSession, getPatientContext, loadCompositionDocument } from './api.js';
import { renderDetail } from './ui/detail.js';
import { renderHeaderLogos, renderPatientHeader } from './ui/layout.js';

const logosHeader = document.getElementById('logos-header');
const pageAnchor = document.getElementById('detail-page-anchor');
const detailPanel = document.getElementById('detail-page-panel');
const feedback = document.getElementById('detail-page-feedback');
const backLink = document.getElementById('detail-page-back');

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    recordCode: params.get('recordCode') || '',
    documentType: params.get('documentType') || '',
    documentNumber: params.get('documentNumber') || ''
  };
}

async function boot() {
  const { recordCode, documentType, documentNumber } = getParams();
  backLink?.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.assign('./');
  });

  await checkSession();
  renderHeaderLogos(logosHeader);

  if (!recordCode || !documentType || !documentNumber) {
    feedback.textContent = 'No fue posible identificar el RDA solicitado.';
    return;
  }

  const patient = await getPatientContext({ documentType, documentNumber });
  renderPatientHeader(pageAnchor, patient);
  const detail = await loadCompositionDocument(recordCode);
  renderDetail(detailPanel, detail);
}

boot().catch((error) => {
  feedback.textContent = error.message || 'No fue posible cargar el detalle.';
});
