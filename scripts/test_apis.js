const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lire .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w]+)\s*=\s*["']?(.*?)["']?\s*$/);
  if (m) env[m[1]] = m[2];
});

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    include: { signals: true }
  });
  console.log('=== RESTAURANTS IN DB ===');
  for (const r of restaurants) {
    console.log(`- ID: ${r.id}, Name: ${r.name}, Address: "${r.address}", Lat/Lon: ${r.latitude}/${r.longitude}, Country: ${r.country}`);
    console.log(`  Signals: ${r.signals.length}`);
    for (const s of r.signals) {
      console.log(`    [${s.type}] (${s.source}) -> data:`, JSON.stringify(s.data));
    }

    // Tester Open-Meteo pour ce restaurant
    console.log(`\nTesting Open-Meteo for ${r.name} (${r.latitude}, ${r.longitude})...`);
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${r.latitude}&longitude=${r.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&timezone=auto`;
      const wRes = await fetch(weatherUrl);
      const wData = await wRes.json();
      console.log('Open-Meteo current:', wData.current);
    } catch (e) {
      console.error('Open-Meteo error:', e.message);
    }

    // Tester Ticketmaster pour ce restaurant
    console.log(`\nTesting Ticketmaster for ${r.name}...`);
    try {
      const tmKey = env.TICKETMASTER_API_KEY;
      const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tmKey}&latlong=${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}&radius=50&unit=km&size=5`;
      const tmRes = await fetch(tmUrl);
      const tmData = await tmRes.json();
      console.log('Ticketmaster status:', tmRes.status);
      console.log('Ticketmaster total elements:', tmData.page?.totalElements);
      if (tmData._embedded?.events) {
        console.log('Events found:', tmData._embedded.events.map(e => e.name));
      } else {
        console.log('No events in 50km radius.');
      }
    } catch (e) {
      console.error('Ticketmaster error:', e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
