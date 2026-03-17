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
    <h1>Ingreso Visor RDA</h1>
    <p class="text-muted">Autentíquese para consultar historia RDA.</p>
    <form id="auth-form" class="identify-form">
      <label>Usuario<input name="username" type="text" required /></label>
      <label>Contraseña<input name="password" type="password" required /></label>
      <button type="submit">Ingresar</button>
    </form>
    <p id="auth-message" class="text-muted"></p>
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

export function renderIdentifyForm(container, documentTypes, onSubmit) {
  const options = documentTypes
    .map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.label)}</option>`)
    .join('');

  container.innerHTML = `
    <h1>Consulta RDA</h1>
    <p class="text-muted">Ingrese identificación del paciente.</p>
    <form id="identify-form" class="identify-form">
      <label>
        Tipo de documento
        <select name="documentType" required>
          <option value="">Seleccione...</option>${options}
        </select>
      </label>
      <label>
        Número de documento
        <input name="documentNumber" type="text" minlength="5" required />
      </label>
      <button type="submit">Consultar</button>
    </form>
    <p id="identify-message" class="text-muted"></p>
  `;

  const form = container.querySelector('#identify-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    onSubmit({
      documentType: data.get('documentType')?.toString() || '',
      documentNumber: data.get('documentNumber')?.toString() || ''
    });
  });
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
      <button type="button" class="secondary" id="logout-btn">Cerrar sesión</button>
      <span class="text-muted">Presione ENTER en número para consultar</span>
    </form>
  `;

  const form = container.querySelector('#persistent-search');
  const input = form.elements.documentNumber;
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const payload = {
      documentType: form.elements.documentType.value,
      documentNumber: form.elements.documentNumber.value
    };
    onSubmit(payload);
  });
  container.querySelector('#logout-btn').addEventListener('click', onLogout);
}

export function setViewerVisibility(showViewer) {
  document.getElementById('identify-panel').classList.toggle('hidden', showViewer);
  document.getElementById('viewer-panel').classList.toggle('hidden', !showViewer);
}

export function setAuthVisibility(isLoggedIn) {
  document.getElementById('auth-panel').classList.toggle('hidden', isLoggedIn);
  document.getElementById('identify-panel').classList.toggle('hidden', !isLoggedIn);
}

export function showIdentifyMessage(message, isError = false) {
  const node = document.getElementById('identify-message');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('alert', isError);
}

export function renderPatientHeader(container, patient, summary) {
  if (!patient) {
    container.innerHTML = '<p class="alert">Paciente no encontrado.</p>';
    return;
  }

  container.innerHTML = `
    <h2>${escapeHtml(patient.fullName)}</h2>
    <div class="patient-grid">
      <div><strong>Documento:</strong> ${escapeHtml(patient.documentType)} ${escapeHtml(patient.documentNumber)}</div>
      <div><strong>Sexo:</strong> ${escapeHtml(patient.sex || 'N/A')}</div>
      <div><strong>Edad:</strong> ${escapeHtml(patient.age || 'N/A')}</div>
      <div><strong>Nacimiento:</strong> ${escapeHtml(patient.birthDate || 'N/A')}</div>
      <div><strong>Aseguradora:</strong> ${escapeHtml(patient.insurer || 'N/A')}</div>
      <div><strong>Total RDA:</strong> ${escapeHtml(summary?.totalRdas ?? '0')}</div>
    </div>
  `;
}
