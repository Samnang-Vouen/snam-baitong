require('dotenv').config();
const { initSchema, ensureInitialAdminFromEnv, createUser, ROLES } = require('../services/user.service');

(async () => {
  try {
    await initSchema();
    const email = process.env.ADMIN_EMAIL || process.argv[2];
    const password = process.env.ADMIN_PASSWORD || process.argv[3];
    if (email && password) {
      const seeded = await ensureInitialAdminFromEnv();
      if (seeded) {
        console.log('Admin created from env');
        process.exit(0);
      } else {
        console.log('Admin already exists or env missing');
        process.exit(0);
      }
    } else {
      // If no env, try CLI args: node src/scripts/seed-admin.js admin@example.com secret
      const argEmail = process.argv[2];
      const argPassword = process.argv[3];
      if (!argEmail || !argPassword) {
        console.error('Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin OR node src/scripts/seed-admin.js <email> <password>');
        process.exit(1);
      }
      await createUser({ email: argEmail, password: argPassword, role: ROLES.ADMIN });
      console.log('Admin created from CLI args');
      process.exit(0);
    }
  } catch (e) {
    console.error('Failed to seed admin:', e.message);
    process.exit(1);
  }
})();
