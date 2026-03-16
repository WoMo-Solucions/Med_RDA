const { openDb } = require('../db/database');
const { resetDatabase, seedDatabase } = require('../seeds/seed');

(async () => {
  const db = openDb();
  try {
    await resetDatabase(db);
    await seedDatabase(db);
    console.log('Database reset and reseeded successfully.');
  } catch (error) {
    console.error('db:reset failed:', error.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
