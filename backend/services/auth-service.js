const crypto = require('crypto');

const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS);
const sessions = new Map();

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true',
    maxAge: SESSION_TTL_MS,
    path: '/'
  };
}

function parseCookieHeader(header) {
  const parsed = {};
  String(header || '')
    .split(';')
    .forEach((item) => {
      const [key, ...rest] = item.trim().split('=');
      if (!key) return;
      parsed[key] = decodeURIComponent(rest.join('='));
    });
  return parsed;
}

function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function validateCredentials(username, password) {
  return username === process.env.APP_USER && password === process.env.APP_PASS;
}

function getSessionFromRequest(req) {
  const token = parseCookieHeader(req.headers.cookie).med_rda_session;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function requireSession(req, res, next) {
  const session = getSessionFromRequest(req);
  if (!session) return res.status(401).json({ success: false, error: 'Sesión no válida.' });
  req.session = session;
  next();
}

function destroySessionFromRequest(req) {
  const token = parseCookieHeader(req.headers.cookie).med_rda_session;
  if (token) sessions.delete(token);
}

function clearExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) sessions.delete(token);
  }
}

setInterval(clearExpiredSessions, 10 * 60 * 1000).unref();

module.exports = {
  buildCookieOptions,
  createSession,
  destroySessionFromRequest,
  getSessionFromRequest,
  requireSession,
  validateCredentials
};
