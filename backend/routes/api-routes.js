const express = require('express');
const {
  queryPatient,
  fetchPatientRdas,
  getRdaDetail,
  getSummary,
  getDocument
} = require('../services/rda-service');
const {
  buildCookieOptions,
  createSession,
  destroySessionFromRequest,
  getSessionFromRequest,
  requireSession,
  validateCredentials
} = require('../services/auth-service');

function validateDocumentInput(payload) {
  const documentType = String(payload?.documentType || '').trim().toUpperCase();
  const documentNumber = String(payload?.documentNumber || '').trim();
  const validType = /^[A-Z]{2,3}$/.test(documentType);
  const validNumber = /^[A-Za-z0-9-]{5,20}$/.test(documentNumber);
  if (!validType || !validNumber) {
    return { ok: false, message: 'Parámetros de documento inválidos.' };
  }
  return { ok: true, documentType, documentNumber };
}

function createApiRouter(db) {
  const router = express.Router();

  router.post('/auth/login', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (!validateCredentials(username, password)) {
      return res.status(401).json({ success: false, error: 'Usuario o contraseña inválidos.' });
    }
    const token = createSession(username);
    res.cookie('med_rda_session', token, buildCookieOptions());
    return res.json({ success: true, data: { username } });
  });

  router.get('/auth/session', (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) return res.status(401).json({ success: false, error: 'Sesión no válida.' });
    return res.json({ success: true, data: { username: session.username } });
  });

  router.post('/auth/logout', (req, res) => {
    destroySessionFromRequest(req);
    res.clearCookie('med_rda_session', { path: '/' });
    return res.json({ success: true, data: { loggedOut: true } });
  });

  router.use(requireSession);

  router.get('/document-types', async (req, res, next) => {
    try {
      const rows = await new Promise((resolve, reject) =>
        db.all('SELECT code, label FROM document_types ORDER BY code', [], (err, data) =>
          err ? reject(err) : resolve(data)
        )
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      next(error);
    }
  });

  router.post('/query-patient', async (req, res, next) => {
    try {
      const validated = validateDocumentInput(req.body);
      if (!validated.ok) return res.status(400).json({ success: false, error: validated.message });

      const patient = await queryPatient(db, validated);
      if (!patient) return res.status(404).json({ success: false, error: 'Paciente no encontrado.' });

      return res.json({ success: true, data: patient });
    } catch (error) {
      next(error);
    }
  });

  router.post('/patient-rda', async (req, res, next) => {
    try {
      const validated = validateDocumentInput(req.body);
      if (!validated.ok) return res.status(400).json({ success: false, error: validated.message });

      const patient = await queryPatient(db, validated);
      if (!patient) return res.status(404).json({ success: false, error: 'Paciente no encontrado.' });

      const result = await fetchPatientRdas(db, patient, {
        rdaType: req.body?.rdaType || '',
        fromDate: req.body?.fromDate || '',
        toDate: req.body?.toDate || ''
      });

      return res.json({ success: true, data: { patient: result.patient || patient, rdas: result.rdas, source: result.provider, fallbackReason: result.fallbackReason || null } });
    } catch (error) {
      next(error);
    }
  });

  router.post('/fhir-summary', async (req, res, next) => {
    try {
      const validated = validateDocumentInput(req.body);
      if (!validated.ok) return res.status(400).json({ success: false, error: validated.message });

      const patient = await queryPatient(db, validated);
      if (!patient) return res.status(404).json({ success: false, error: 'Paciente no encontrado.' });

      const summary = await getSummary(db, patient.id);
      return res.json({ success: true, data: { patient, summary } });
    } catch (error) {
      next(error);
    }
  });

  router.post('/composition-document', async (req, res, next) => {
    try {
      const recordCode = String(req.body?.recordCode || '').trim();
      if (!recordCode) return res.status(400).json({ success: false, error: 'recordCode es obligatorio.' });

      const detail = await getRdaDetail(db, recordCode);
      if (!detail) return res.status(404).json({ success: false, error: 'RDA no encontrado.' });

      return res.json({ success: true, data: detail });
    } catch (error) {
      next(error);
    }
  });

  router.get('/download-document', async (req, res, next) => {
    try {
      const reference = String(req.query.reference || '').trim();
      if (!reference) return res.status(400).json({ success: false, error: 'reference es obligatorio.' });

      const doc = await getDocument(db, reference);
      if (!doc) return res.status(404).json({ success: false, error: 'Documento no encontrado.' });

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createApiRouter };
