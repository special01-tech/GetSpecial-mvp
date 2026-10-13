const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const tmMatch = envLocal.match(/TICKETMASTER_API_KEY=(.*)/);
let tmKey = tmMatch ? tmMatch[1].trim() : '';
tmKey = tmKey.replace(/^["']|["']$/g, '');

const calMatch = envLocal.match(/CALENDARIFIC_API_KEY=(.*)/);
let calKey = calMatch ? calMatch[1].trim() : '';
calKey = calKey.replace(/^["']|["']$/g, '');

console.log('TM key length:', tmKey.length);
console.log('CAL key length:', calKey.length);

async function testApis() {
  // Test Ticketmaster with countryCode and city
  try {
    const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tmKey}&countryCode=US&size=5&sort=date,asc`;
    const tmRes = await fetch(tmUrl);
    const tmData = await tmRes.json();
    if (tmData.fault) {
      console.log('Ticketmaster Error:', tmData.fault);
    } else {
      console.log('Ticketmaster SUCCESS with countryCode=FR! Total elements:', tmData.page?.totalElements);
      const events = tmData._embedded?.events || [];
      console.log('Returned events count:', events.length);
      events.forEach((e) => console.log('TM Event:', e.name, '=> URL:', e.url));
    }
  } catch (err) {
    console.error('TM fetch failed:', err);
  }

  // Test Calendarific
  try {
    const calRes = await fetch(`https://calendarific.com/api/v2/holidays?api_key=${calKey}&country=FR&year=2026`);
    const calData = await calRes.json();
    if (calData.meta?.code !== 200) {
      console.log('Calendarific Error:', calData.meta);
    } else {
      console.log('Calendarific SUCCESS! Total holidays:', calData.response?.holidays?.length);
      const sample = calData.response.holidays.slice(0, 3);
      sample.forEach((h) => console.log('CAL Event:', h.name, '=> URL:', h.canonical_url));
    }
  } catch (err) {
    console.error('CAL fetch failed:', err);
  }
}

testApis();
