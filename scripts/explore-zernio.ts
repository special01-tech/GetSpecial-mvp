export {};
const API_KEY = "sk_275c6590fca3c81fa323ee48caab93f8b5e148d92abf7e68e5d3a4499ffd98f7";
const BASE_URL = "https://api.zernio.com/v1";

async function exploreZernio() {
  const paths = [
    { method: 'POST', path: '/connect/token' },
    { method: 'POST', path: '/connect' },
    { method: 'POST', path: '/auth/url' },
    { method: 'GET', path: '/profiles' },
    { method: 'GET', path: '/analytics' },
    { method: 'GET', path: '/analytics/overview' },
    { method: 'GET', path: '/posts' },
  ];

  for (const { method, path } of paths) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify({ platform: 'instagram' }) : undefined,
      });
      console.log(`${method} ${path} -> Status: ${res.status}`);
      if (res.status !== 404) {
        const data = await res.json();
        console.log(`Response for ${path}:`, JSON.stringify(data).slice(0, 300));
      }
    } catch (e: any) {
      console.log(`${method} ${path} error:`, e.message);
    }
  }
}

exploreZernio();
