export {};
const API_KEY = process.env.ZERNIO_API_KEY || "";
const BASE_URL = process.env.ZERNIO_API_BASE_URL || "https://api.zernio.com/v1";

async function testZernio() {
  console.log("=== Testing Zernio API ===");
  try {
    const res = await fetch(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    console.log("GET /v1/accounts Status:", res.status);
    const data = await res.json();
    console.log("Accounts Data:", JSON.stringify(data, null, 2));

    // Test connect / oauth endpoint if available
    for (const endpoint of ['/connect', '/oauth', '/auth/connect', '/platforms']) {
      try {
        const testRes = await fetch(`${BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${API_KEY}` },
        });
        console.log(`GET /v1${endpoint} Status:`, testRes.status);
        if (testRes.ok) {
          const epData = await testRes.json();
          console.log(`Data for ${endpoint}:`, JSON.stringify(epData));
        }
      } catch (e: any) {
        console.log(`Endpoint ${endpoint} failed:`, e.message);
      }
    }
  } catch (err: any) {
    console.error("Zernio test error:", err);
  }
}

testZernio();
