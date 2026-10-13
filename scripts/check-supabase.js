const fs = require('fs');
const path = require('path');

// Parser .env.local et .env manuellement
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

loadEnv(path.join(__dirname, '..', '.env.local'));
loadEnv(path.join(__dirname, '..', '.env'));

const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();

async function checkSupabase() {
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC;
    `);
    console.log('TABLES_FOUND:', tables.map(t => t.table_name));

    const columns = await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);
    console.log('COLUMNS_COUNT:', columns.length);
  } catch (err) {
    console.error('ERROR_CHECKING_SUPABASE:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSupabase();
