function fromWindowContext() {
  const context = window.SAP_CONTEXT;
  if (!context) return null;
  return {
    documentType: context.documentType || context.tipoDocumento || '',
    documentNumber: context.documentNumber || context.numeroDocumento || '',
    fullName: context.fullName || context.nombreCompleto || ''
  };
}

function fromQueryParams(searchParams) {
  return {
    documentType: searchParams.get('documentType') || searchParams.get('tipoDocumento') || '',
    documentNumber: searchParams.get('documentNumber') || searchParams.get('numeroDocumento') || '',
    fullName: searchParams.get('fullName') || ''
  };
}

export function getPatientContext(searchParams) {
  const winContext = fromWindowContext();
  if (winContext?.documentType && winContext?.documentNumber) {
    return winContext;
  }

  const queryContext = fromQueryParams(searchParams);
  if (queryContext.documentType && queryContext.documentNumber) {
    return queryContext;
  }

  return null;
}
