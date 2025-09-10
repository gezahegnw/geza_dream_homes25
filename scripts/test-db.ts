import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const count = await prisma.lead.count();
    console.log(`✅ Found ${count} leads in the database`);
    
    // Test insert
    const newLead = await prisma.lead.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message',
      },
    });
    console.log('✅ Successfully created test lead:', newLead);
    
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
