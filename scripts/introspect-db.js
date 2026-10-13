const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/DATABASE_URL=(.*)/);
const dbUrl = match ? match[1].replace(/['"]/g, '').trim() : '';

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } }
});

async function main() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Tables in public schema:', tables.map(t => t.table_name));

  for (const t of tables) {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = '${t.table_name}'
      ORDER BY ordinal_position;
    `);
    console.log(`\nTable [${t.table_name}]:`);
    console.log(cols.map(c => `  - ${c.column_name}: ${c.data_type}`).join('\n'));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
