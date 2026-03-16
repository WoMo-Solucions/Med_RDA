const { run } = require('../db/database');

async function seedDatabase(db) {
  await run(db, 'PRAGMA foreign_keys = ON');

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS document_types (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT NOT NULL,
      sex TEXT,
      birth_date TEXT,
      insurer TEXT,
      UNIQUE(document_type, document_number)
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS rda_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_code TEXT NOT NULL UNIQUE,
      patient_id INTEGER NOT NULL,
      institution_id INTEGER,
      attention_date TEXT NOT NULL,
      rda_type TEXT NOT NULL,
      service_professional TEXT,
      main_diagnosis TEXT,
      main_procedure TEXT,
      document_class TEXT,
      clinical_summary TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(institution_id) REFERENCES institutions(id)
    )`
  );

  await run(db, `CREATE TABLE IF NOT EXISTS diagnoses (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER, code TEXT, description TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS procedures (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER, code TEXT, description TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS medications (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER, name TEXT, dosage TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS observations (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER, note TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS attachments (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER, name TEXT, reference TEXT, content TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);
  await run(db, `CREATE TABLE IF NOT EXISTS timeline_events (id INTEGER PRIMARY KEY AUTOINCREMENT, record_id INTEGER, event_time TEXT, event_text TEXT, FOREIGN KEY(record_id) REFERENCES rda_records(id) ON DELETE CASCADE)`);


  await run(db, 'DELETE FROM timeline_events');
  await run(db, 'DELETE FROM attachments');
  await run(db, 'DELETE FROM observations');
  await run(db, 'DELETE FROM medications');
  await run(db, 'DELETE FROM procedures');
  await run(db, 'DELETE FROM diagnoses');
  await run(db, 'DELETE FROM rda_records');
  await run(db, 'DELETE FROM patients');
  await run(db, 'DELETE FROM institutions');
  await run(db, 'DELETE FROM document_types');

  const docTypes = [
    ['CC', 'Cédula de ciudadanía'],
    ['TI', 'Tarjeta de identidad'],
    ['CE', 'Cédula de extranjería'],
    ['PA', 'Pasaporte'],
    ['RC', 'Registro civil']
  ];

  for (const [code, label] of docTypes) {
    await run(db, 'INSERT OR IGNORE INTO document_types (code, label) VALUES (?, ?)', [code, label]);
  }

  const institutions = ['Clínica Santa Aurora', 'Hospital San Gabriel', 'Centro Médico Horizonte', 'IPS Integrada Norte', 'Diagnóstico Avanzado IPS'];
  for (const name of institutions) {
    await run(db, 'INSERT OR IGNORE INTO institutions (name) VALUES (?)', [name]);
  }

  const patients = [
    ['María Fernanda Gómez Rojas', 'CC', '1020304050', 'Femenino', '1987-04-16', 'EPS Salud Integral'],
    ['Carlos Alberto Rincón', 'CC', '800900100', 'Masculino', '1974-11-03', 'EPS Vida Plena'],
    ['Ana Lucía Pardo', 'CC', '12345678', 'Femenino', '1990-02-21', 'Nueva EPS'],
    ['José Miguel Torres', 'CE', 'X900123', 'Masculino', '1982-09-13', 'Sanitas'],
    ['Laura Camila Duarte', 'TI', '10556677', 'Femenino', '2008-06-08', 'Sura']
  ];

  for (const p of patients) {
    await run(
      db,
      'INSERT OR IGNORE INTO patients (full_name, document_type, document_number, sex, birth_date, insurer) VALUES (?, ?, ?, ?, ?, ?)',
      p
    );
  }

  const patientRows = await new Promise((resolve, reject) => db.all('SELECT id, document_number FROM patients', [], (e, r) => (e ? reject(e) : resolve(r))));
  const instRows = await new Promise((resolve, reject) => db.all('SELECT id, name FROM institutions', [], (e, r) => (e ? reject(e) : resolve(r))));
  const patientMap = Object.fromEntries(patientRows.map((r) => [r.document_number, r.id]));
  const instMap = Object.fromEntries(instRows.map((r) => [r.name, r.id]));

  const records = [
    ['RDA-1001', '1020304050', 'Clínica Santa Aurora', '2025-01-15', 'Urgencias'],
    ['RDA-1002', '1020304050', 'Centro Médico Horizonte', '2025-02-12', 'Consulta externa'],
    ['RDA-1003', '1020304050', 'Hospital San Gabriel', '2025-03-04', 'Hospitalización'],
    ['RDA-1004', '1020304050', 'Diagnóstico Avanzado IPS', '2025-04-18', 'Apoyo diagnóstico'],
    ['RDA-2001', '800900100', 'IPS Integrada Norte', '2025-01-10', 'Consulta externa'],
    ['RDA-2002', '800900100', 'Clínica Santa Aurora', '2025-02-03', 'Urgencias'],
    ['RDA-2003', '800900100', 'Hospital San Gabriel', '2025-02-22', 'Hospitalización'],
    ['RDA-2004', '800900100', 'Diagnóstico Avanzado IPS', '2025-03-11', 'Apoyo diagnóstico'],
    ['RDA-3001', '12345678', 'Centro Médico Horizonte', '2025-01-30', 'Consulta externa'],
    ['RDA-3002', '12345678', 'Clínica Santa Aurora', '2025-03-05', 'Urgencias'],
    ['RDA-3003', '12345678', 'Diagnóstico Avanzado IPS', '2025-03-14', 'Apoyo diagnóstico'],
    ['RDA-3004', '12345678', 'Hospital San Gabriel', '2025-04-07', 'Hospitalización'],
    ['RDA-4001', 'X900123', 'IPS Integrada Norte', '2025-01-18', 'Consulta externa'],
    ['RDA-4002', 'X900123', 'Clínica Santa Aurora', '2025-02-28', 'Urgencias'],
    ['RDA-4003', 'X900123', 'Hospital San Gabriel', '2025-03-30', 'Hospitalización'],
    ['RDA-4004', 'X900123', 'Diagnóstico Avanzado IPS', '2025-04-10', 'Apoyo diagnóstico'],
    ['RDA-5001', '10556677', 'IPS Integrada Norte', '2025-01-14', 'Consulta externa'],
    ['RDA-5002', '10556677', 'Clínica Santa Aurora', '2025-02-08', 'Urgencias'],
    ['RDA-5003', '10556677', 'Centro Médico Horizonte', '2025-03-17', 'Consulta externa'],
    ['RDA-5004', '10556677', 'Diagnóstico Avanzado IPS', '2025-04-21', 'Apoyo diagnóstico']
  ];

  for (const [code, docNumber, institution, date, type] of records) {
    await run(
      db,
      `INSERT OR IGNORE INTO rda_records
      (record_code, patient_id, institution_id, attention_date, rda_type, service_professional, main_diagnosis, main_procedure, document_class, clinical_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        patientMap[docNumber],
        instMap[institution],
        date,
        type,
        `${type} - Profesional asignado`,
        'Diagnóstico clínico principal',
        'Procedimiento clínico principal',
        'Composición clínica',
        `Resumen clínico para ${code}`
      ]
    );
  }

  const recordRows = await new Promise((resolve, reject) => db.all('SELECT id, record_code FROM rda_records', [], (e, r) => (e ? reject(e) : resolve(r))));
  for (const row of recordRows) {
    await run(db, 'INSERT OR IGNORE INTO diagnoses (record_id, code, description) VALUES (?, ?, ?)', [row.id, 'Z00.0', `Diagnóstico asociado ${row.record_code}`]);
    await run(db, 'INSERT OR IGNORE INTO procedures (record_id, code, description) VALUES (?, ?, ?)', [row.id, '99.01', `Procedimiento asociado ${row.record_code}`]);
    await run(db, 'INSERT OR IGNORE INTO medications (record_id, name, dosage) VALUES (?, ?, ?)', [row.id, 'Medicamento base', '1 tableta cada 12h']);
    await run(db, 'INSERT OR IGNORE INTO observations (record_id, note) VALUES (?, ?)', [row.id, `Observación clínica ${row.record_code}`]);
    await run(db, 'INSERT OR IGNORE INTO attachments (record_id, name, reference, content) VALUES (?, ?, ?, ?)', [row.id, 'Epicrisis', `${row.record_code}-DOC`, `Contenido simulado de documento ${row.record_code}`]);
    await run(db, 'INSERT OR IGNORE INTO timeline_events (record_id, event_time, event_text) VALUES (?, ?, ?)', [row.id, '08:00', 'Ingreso']);
    await run(db, 'INSERT OR IGNORE INTO timeline_events (record_id, event_time, event_text) VALUES (?, ?, ?)', [row.id, '09:00', 'Atención']);
  }
}

module.exports = { seedDatabase };
