function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderAuthForm(container, onSubmit) {
  container.innerHTML = `
    <div class="login-shell">
      <div class="login-brand">
        <img src="https://www.minsalud.gov.co/ihce/PublishingImages/Logos/logo-IHCE.png" alt="IHCE" class="logo-ihce" />
        <img src="./assets/img/mySiss.png" alt="mySiss" class="logo-mysiss" />
      </div>
      <div class="login-form-wrap">
        <h1>Iniciar sesión</h1>
        <p class="text-muted">Autentíquese para consultar historial de atención.</p>
        <form id="auth-form" class="identify-form">
          <label>Usuario<input name="username" type="text" required /></label>
          <label>Contraseña<input name="password" type="password" required /></label>
          <button type="submit">Ingresar</button>
        </form>
        <p id="auth-message" class="text-muted"></p>
      </div>
    </div>
  `;

  container.querySelector('#auth-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      username: data.get('username')?.toString().trim() || '',
      password: data.get('password')?.toString() || ''
    });
  });
}

export function showAuthMessage(message, isError = false) {
  const node = document.getElementById('auth-message');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('alert', isError);
}

export function renderPersistentSearch(container, documentTypes, currentContext, detailOpenMode, onSubmit, onModeChange) {
  const options = documentTypes
    .map(
      (item) =>
        `<option value="${escapeHtml(item.code)}" ${
          item.code === currentContext.documentType ? 'selected' : ''
        }>${escapeHtml(item.label)}</option>`
    )
    .join('');

  container.innerHTML = `
    <div class="search-toolbar-card">
      <form id="persistent-search" class="search-header-form">
        <label>Tipo de documento
          <select name="documentType" required>${options}</select>
        </label>
        <label>Número de documento
          <input name="documentNumber" type="text" value="${escapeHtml(currentContext.documentNumber || '')}" required />
        </label>
        <button type="submit">Consultar</button>
      </form>
      <div class="viewer-toolbar-actions">
        <label class="detail-mode-control">Detalle
          <select name="detailOpenMode">
            <option value="modal" ${detailOpenMode === 'modal' ? 'selected' : ''}>Popup</option>
            <option value="page" ${detailOpenMode === 'page' ? 'selected' : ''}>Página</option>
          </select>
        </label>
      </div>
    </div>
  `;

  const form = container.querySelector('#persistent-search');
  const detailMode = container.querySelector('select[name="detailOpenMode"]');

  detailMode.addEventListener('change', () => onModeChange(detailMode.value));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const payload = {
      documentType: form.elements.documentType.value,
      documentNumber: form.elements.documentNumber.value
    };
    onSubmit(payload);
  });
}

export function renderHeaderLogos(container) {
  container.innerHTML = `
    <div class="top-header-grid">
      <div class="logo-left"><img src="./assets/img/mySiss.png" alt="mySiss" /></div>
      <div class="logo-center"><img src="https://www.minsalud.gov.co/ihce/PublishingImages/Logos/logo-IHCE.png" alt="IHCE" /></div>
      <div class="logo-right"><img src="./assets/img/HIS.png" alt="HIS" /></div>
    </div>
  `;
}

export function setViewerVisibility(showViewer) {
  document.getElementById('viewer-panel').classList.toggle('hidden', !showViewer);
}

export function setAuthVisibility(isLoggedIn) {
  document.getElementById('auth-panel').classList.toggle('hidden', isLoggedIn);
}

export function showIdentifyMessage(message, isError = false) {
  const node = document.getElementById('identify-message');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('alert', isError);
  node.classList.toggle('hidden', !message);
}

export function renderPatientHeader(container, patient) {
  if (!patient) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="patient-summary-item patient-summary-primary">
      <span class="patient-summary-label">Paciente</span>
      <strong class="patient-name">${escapeHtml(patient.fullName)}</strong>
    </div>
    <div class="patient-summary-item">
      <span class="patient-summary-label">Documento</span>
      <span>${escapeHtml(patient.documentType)} ${escapeHtml(patient.documentNumber)}</span>
    </div>
    <div class="patient-summary-item">
      <span class="patient-summary-label">Género</span>
      <span>${escapeHtml(patient.sex || 'N/A')}</span>
    </div>
    <div class="patient-summary-item">
      <span class="patient-summary-label">Edad</span>
      <span>${escapeHtml(patient.age || 'N/A')}</span>
    </div>
    <div class="patient-summary-item">
      <span class="patient-summary-label">Fecha de nacimiento</span>
      <span>${escapeHtml(patient.birthDate || 'N/A')}</span>
    </div>
    <div class="patient-summary-item">
      <span class="patient-summary-label">EPS</span>
      <span>${escapeHtml(patient.insurer || 'N/A')}</span>
    </div>
  `;
}
