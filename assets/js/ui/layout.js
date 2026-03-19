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
        <form id="auth-form" class="identify-form" autocomplete="off">
          <label>Usuario<input name="username" type="text" autocomplete="off" required /></label>
          <label>Contraseña<input name="password" type="password" autocomplete="new-password" required /></label>
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

export function renderPersistentSearch(container, documentTypes, currentContext, onSubmit, onLogout) {
  const options = documentTypes
    .map(
      (item) =>
        `<option value="${escapeHtml(item.code)}" ${
          item.code === currentContext.documentType ? 'selected' : ''
        }>${escapeHtml(item.label)}</option>`
    )
    .join('');

  container.innerHTML = `
    <form id="persistent-search" class="search-header-form">
      <label>Tipo de documento
        <select name="documentType" required>${options}</select>
      </label>
      <label>Número de documento
        <input name="documentNumber" type="text" value="${escapeHtml(currentContext.documentNumber || '')}" required />
      </label>
      <button type="submit">Consultar</button>
      <button type="button" class="secondary" id="logout-btn">Cerrar sesión</button>
    </form>
  `;

  const form = container.querySelector('#persistent-search');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onSubmit({
      documentType: form.elements.documentType.value,
      documentNumber: form.elements.documentNumber.value
    });
  });
  container.querySelector('#logout-btn').addEventListener('click', onLogout);
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
  const panel = document.getElementById('viewer-panel');
  if (panel) panel.classList.toggle('hidden', !showViewer);
}

export function setAuthVisibility(isLoggedIn) {
  const panel = document.getElementById('auth-panel');
  if (panel) panel.classList.toggle('hidden', isLoggedIn);
<<<<<<< codex/finalize-system-implementation-and-hardening-016t2o
=======
}

export function setAuthVisibility(isLoggedIn) {
  document.getElementById('auth-panel').classList.toggle('hidden', isLoggedIn);
>>>>>>> main
}

export function showIdentifyMessage(message, isError = false) {
  const node = document.getElementById('identify-message');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('alert', isError);
}

export function renderPatientHeader(anchorNode, patient) {
  const existing = document.getElementById('patient-header');
  if (existing) existing.remove();
  if (!patient || !anchorNode?.parentNode) return;

  const header = document.createElement('header');
  header.id = 'patient-header';
  header.className = 'patient-header';
  header.innerHTML = `
    <h2 class="patient-name">${escapeHtml(patient.fullName)}</h2>
    <div class="patient-inline">
      <span>${escapeHtml(patient.documentType)} ${escapeHtml(patient.documentNumber)}</span>
      <span>${escapeHtml(patient.sex || 'N/A')}</span>
      <span>${escapeHtml(patient.ageLabel || 'N/A')}</span>
      <span>${escapeHtml(patient.birthDate || 'N/A')}</span>
      <span>${escapeHtml(patient.insurer || 'N/A')}</span>
    </div>
    <p id="identify-message" class="text-muted"></p>
  `;
  anchorNode.parentNode.insertBefore(header, anchorNode);
}
