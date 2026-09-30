export {};
const API_KEY = "sk_275c6590fca3c81fa323ee48caab93f8b5e148d92abf7e68e5d3a4499ffd98f7";
const BASE_URL = "https://api.zernio.com/v1";

async function checkAnalyticsDetail() {
  const res = await fetch(`${BASE_URL}/analytics`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = await res.json();
  console.log("FULL ANALYTICS RESPONSE:\n", JSON.stringify(data, null, 2));
}

checkAnalyticsDetail();
