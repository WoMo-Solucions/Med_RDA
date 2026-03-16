const { openDb } = require('../db/database');
const { createSchema } = require('../seeds/seed');

(async () => {
  const db = openDb();
  try {
    await createSchema(db);
    console.log('Database schema initialized.');
  } catch (error) {
    console.error('db:init failed:', error.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
