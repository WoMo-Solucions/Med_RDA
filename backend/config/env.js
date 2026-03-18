const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = ['APP_USER', 'APP_PASS', 'SESSION_TTL_MS', 'DATA_PROVIDER', 'MINISTERIO_ENABLED'];

function parseDotenvFile(content) {
  const output = {};
  for (const line of String(content || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    output[key] = value;
  }
  return output;
}

function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const parsed = parseDotenvFile(fs.readFileSync(envPath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  const missing = REQUIRED_VARS.filter((key) => !String(process.env[key] || '').trim());
  if (missing.length) {
    throw new Error(`Variables requeridas no configuradas: ${missing.join(', ')}`);
  }

  const ttl = Number(process.env.SESSION_TTL_MS);
  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new Error('SESSION_TTL_MS debe ser un número positivo.');
  }

  process.env.DATA_PROVIDER = String(process.env.DATA_PROVIDER || '').trim().toLowerCase();
  process.env.MINISTERIO_ENABLED = String(process.env.MINISTERIO_ENABLED || '').trim().toLowerCase();
}

module.exports = { loadEnv };
