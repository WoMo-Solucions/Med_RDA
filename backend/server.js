const path = require('path');
const express = require('express');
const { openDb } = require('./db/database');
const { seedDatabase } = require('./seeds/seed');
const { createApiRouter } = require('./routes/api-routes');

const PORT = Number(process.env.PORT || 8086);
const app = express();
const db = openDb();

app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

app.use('/api', createApiRouter(db));

app.use('/assets', express.static(path.resolve(__dirname, '../assets')));
app.get(['/index.html', '/'], (req, res) => {
  res.sendFile(path.resolve(__dirname, '../index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Recurso no encontrado.' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, error: 'Error interno del servidor.' });
});

seedDatabase(db)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Med_RDA backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No fue posible inicializar la base de datos:', error);
    process.exit(1);
  });
