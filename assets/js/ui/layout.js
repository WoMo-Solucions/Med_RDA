export function renderIdentifyForm(container, onSubmit) {
  container.innerHTML = `
    <h1>Consulta RDA</h1>
    <p class="text-muted">Ingrese la identificación del paciente para consultar su Resumen Digital de Atención.</p>
    <form id="identify-form" class="identify-form">
      <label>
        Tipo de documento
        <select name="documentType" required>
          <option value="">Seleccione...</option>
          <option value="CC">CC</option>
          <option value="TI">TI</option>
          <option value="CE">CE</option>
          <option value="PA">PA</option>
        </select>
      </label>
      <label>
        Número de documento
        <input name="documentNumber" type="text" inputmode="numeric" minlength="5" required />
      </label>
      <button type="submit">Consultar</button>
    </form>
    <p id="identify-message" class="text-muted"></p>
  `;

  const form = container.querySelector('#identify-form');
  const message = container.querySelector('#identify-message');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      documentType: formData.get('documentType')?.toString() || '',
      documentNumber: formData.get('documentNumber')?.toString() || ''
    };

    if (!payload.documentType || !payload.documentNumber) {
      message.textContent = 'Debe diligenciar tipo y número de documento.';
      return;
    }

    message.textContent = '';
    onSubmit(payload);
  });
}

export function setViewerVisibility(showViewer) {
  document.getElementById('identify-panel').classList.toggle('hidden', showViewer);
  document.getElementById('viewer-panel').classList.toggle('hidden', !showViewer);
}

export function showIdentifyMessage(message, isError = false) {
  const messageNode = document.getElementById('identify-message');
  if (!messageNode) return;
  messageNode.textContent = message;
  messageNode.classList.toggle('alert', isError);
}

export function renderPatientHeader(container, patient) {
  if (!patient) {
    container.innerHTML = '<p class="alert">No se encontró información del paciente.</p>';
    return;
  }

  container.innerHTML = `
    <h2>${patient.fullName}</h2>
    <div class="patient-grid">
      <div><strong>Documento:</strong> ${patient.documentType} ${patient.documentNumber}</div>
      <div><strong>Sexo:</strong> ${patient.sex || 'N/A'}</div>
      <div><strong>Edad:</strong> ${patient.age || 'N/A'}</div>
      <div><strong>Fecha de nacimiento:</strong> ${patient.birthDate || 'N/A'}</div>
      <div><strong>Entidad:</strong> ${patient.insurer || 'N/A'}</div>
    </div>
  `;
}
