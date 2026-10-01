async function testHttpRoutes() {
  const routes = [
    { name: 'Splash / Home', url: 'http://localhost:3000/' },
    { name: 'Login / Register Page', url: 'http://localhost:3000/login' },
    { name: 'Today Dashboard', url: 'http://localhost:3000/dashboard' },
    { name: 'Planning Page', url: 'http://localhost:3000/dashboard/planning' },
    { name: 'Settings Page', url: 'http://localhost:3000/dashboard/settings' },
    { name: 'Live Signals API', url: 'http://localhost:3000/api/signals/today' },
  ];

  console.log('================================================================');
  console.log('🌐 VERIFYING ALL GETSPECIAL HTTP ROUTES ON RUNNING DEV SERVER');
  console.log('================================================================\n');

  for (const r of routes) {
    try {
      const res = await fetch(r.url);
      const isOk = res.status >= 200 && res.status < 400;
      console.log(`${isOk ? '✅' : '❌'} [HTTP ${res.status}] ${r.name.padEnd(25)} -> ${r.url}`);
    } catch (err: any) {
      console.log(`❌ [CONN ERROR] ${r.name.padEnd(25)} -> ${err.message}`);
    }
  }
}

testHttpRoutes().catch(console.error);
