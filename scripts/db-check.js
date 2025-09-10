// scripts/db-check.js
require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  // Log the DATABASE_URL being used
  console.log('DATABASE_URL =', process.env.DATABASE_URL);

  // Enable Prisma logs for visibility
  const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
  try {
    await prisma.$connect();
    console.log('Connected to DB');

    // Diagnostics: current database and search_path
    const [dbRow] = await prisma.$queryRaw`SELECT current_database() AS db`;
    const [schemaRow] = await prisma.$queryRaw`SELECT current_schema() AS schema`;
    const [spRow] = await prisma.$queryRaw`SHOW search_path`;
    console.log('current_database =', dbRow?.db, 'current_schema =', schemaRow?.schema, 'search_path =', spRow?.search_path || spRow?.searchpath || JSON.stringify(spRow));

    // List public tables
    const tables = await prisma.$queryRaw`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('public tables:', tables);

    const before = await prisma.lead.count();
    console.log('count before:', before);

    const email = `studio_test_${Date.now()}@example.com`;
    const r = await prisma.lead.create({
      data: { name: 'Studio Test', email },
    });
    console.log('created id:', r.id, 'email:', email);

    const after = await prisma.lead.count();
    console.log('count after:', after);
  } catch (e) {
    console.error('DB check failed:');
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
