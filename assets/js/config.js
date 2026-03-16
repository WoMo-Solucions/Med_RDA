export const MODES = {
  SAP: 'sap',
  STANDALONE: 'standalone'
};

export function getRuntimeMode(searchParams, hasSapContext) {
  const modeParam = (searchParams.get('mode') || '').toLowerCase();
  if (modeParam === MODES.SAP || modeParam === MODES.STANDALONE) {
    return modeParam;
  }
  return hasSapContext ? MODES.SAP : MODES.STANDALONE;
}
