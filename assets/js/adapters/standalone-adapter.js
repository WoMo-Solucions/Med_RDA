export function getPatientContext(formValues) {
  return {
    documentType: (formValues.documentType || '').trim(),
    documentNumber: (formValues.documentNumber || '').trim()
  };
}
