const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const anonMatch = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const serviceMatch = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].replace(/['"]/g, '').trim() : '';
const anon = anonMatch ? anonMatch[1].replace(/['"]/g, '').trim() : '';
const serviceKey = serviceMatch ? serviceMatch[1].replace(/['"]/g, '').trim() : '';

console.log('Supabase URL:', url);
console.log('Anon Key length:', anon.length);
console.log('Service Key length:', serviceKey.length);

async function checkAuth() {
  const supabase = createClient(url, anon);

  try {
    // 1. Tester l'appel à l'API Auth Settings
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: anon,
      },
    });
    if (res.ok) {
      const settings = await res.json();
      console.log('Auth external providers:', settings.external);
      console.log('Google provider enabled?', settings.external?.google);
    } else {
      console.log('Settings endpoint status:', res.status);
    }
  } catch (err) {
    console.error('Settings check error:', err.message);
  }

  // 2. Tester getUrlForProvider pour Google
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    });
    if (error) {
      console.log('Google OAuth error:', error.message);
    } else {
      console.log('Google OAuth URL generated successfully:');
      console.log('URL starts with:', data?.url?.slice(0, 80) + '...');
    }
  } catch (err) {
    console.error('OAuth test error:', err.message);
  }

  // 3. Tester la connexion Prisma à la base Supabase PostgreSQL
  try {
    const dbUrlMatch = envLocal.match(/DATABASE_URL=(.*)/);
    if (dbUrlMatch) {
      let dbUrl = dbUrlMatch[1].replace(/['"]/g, '').trim();
      dbUrl = dbUrl.replace('aws-0-eu-west-3.pooler.supabase.com', 'aws-0-us-west-1.pooler.supabase.com');
      process.env.DATABASE_URL = dbUrl;
      const parsedUrl = new URL(dbUrl);
      console.log('\n--- ANALYSE DE LA CONNEXION DATABASE_URL (us-west-1) ---');
      console.log('Username:', parsedUrl.username);
      console.log('Host:', parsedUrl.host);
      console.log('Port:', parsedUrl.port);
      console.log('Database:', parsedUrl.pathname);
    }
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    // 3. Tester la lecture directe des tables via Prisma
    const [users, rests] = await Promise.all([
      prisma.user.findMany(),
      prisma.restaurant.findMany(),
    ]);
    console.log('\n🎉 SUCCÈS TOTAL DE CONNEXION POSTGRESQL / PRISMA !');
    console.log('Total Users réels en base Supabase:', users.length);
    users.forEach((u) => console.log('  - User ID:', u.id, '| Email:', u.email, '| Nom:', u.name));
    console.log('Total Restaurants réels en base Supabase:', rests.length);
    rests.forEach((r) => console.log('  - Resto ID:', r.id, '| Nom:', r.name, '| UserId:', r.userId));
  } catch (dbErr) {
    console.error('Prisma DB error:', dbErr.message);
  }
}

checkAuth();
