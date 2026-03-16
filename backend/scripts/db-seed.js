const { openDb } = require('../db/database');
const { seedDatabase } = require('../seeds/seed');

(async () => {
  const db = openDb();
  try {
    await seedDatabase(db);
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('db:seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
