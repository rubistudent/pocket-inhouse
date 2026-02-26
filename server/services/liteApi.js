import axios from "axios";

// Amadeus API client - test environment
const clientId = process.env.AMADEUS_CLIENT_ID;
const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
const baseURL = "https://test.api.amadeus.com";

let accessToken = null;
let tokenExpiry = null;

// Step 1: Get Amadeus access token
async function getAccessToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }
  try {
    const resp = await axios.post(
      `${baseURL}/v1/security/oauth2/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    accessToken = resp.data.access_token;
    tokenExpiry = Date.now() + (resp.data.expires_in * 1000 - 30000);
    return accessToken;
  } catch (err) {
    console.error("Amadeus token error:", err.response?.data || err.message);
    throw err;
  }
}

export async function searchProperties(params) {
  let token;
  try {
    token = await getAccessToken();
  } catch (err) {
    console.error("Amadeus auth failed in searchProperties:", err?.response?.data || err.message);
    // Return empty result so controllers can gracefully fall back to local DB hotels
    return { data: [] };
  }
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: { Authorization: `Bearer ${token}` }
  });

  const query = params.query || params.q || "";
  const cityCode = extractCityCode(query);

  if (!cityCode) {
    console.log("No city code found for query:", query);
    return { data: [] };
  }

  // ✅ STEP 1: Get hotel IDs for the city
  console.log(`Searching hotels for cityCode: ${cityCode}`);
  const hotelsResp = await client.get("/v1/reference-data/locations/hotels/by-city", {
    params: { cityCode, radius: 20, radiusUnit: "KM", hotelSource: "ALL" }
  });

  const hotelIds = (hotelsResp.data?.data || [])
    .slice(0, 10) // only take first 10 to avoid huge requests
    .map(h => h.hotelId);

  if (hotelIds.length === 0) {
    return { data: [] };
  }

  // ✅ STEP 2: Get offers for those hotel IDs
  const offersResp = await client.get("/v3/shopping/hotel-offers", {
    params: {
      hotelIds: hotelIds.join(","),
      adults: params.adults || 1,
      checkInDate: params.checkInDate || getDefaultCheckIn(),
      checkOutDate: params.checkOutDate || getDefaultCheckOut(),
      roomQuantity: params.rooms || 1,
      currency: "USD",
      bestRateOnly: true
    }
  });

  return offersResp;
}

export async function createBooking(body) {
  return {
    data: {
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
      message: "Booking initiated. Contact support for confirmation."
    }
  };
}

// Map city names to Amadeus city codes
function extractCityCode(query) {
  const cityMap = {
    nairobi: "NBO",
    "nairobi, kenya": "NBO",
    kenya: "NBO",
    nbo: "NBO",
    mombasa: "MBA",
    zanzibar: "ZNZ",
    london: "LON",
    "new york": "NYC",
    nyc: "NYC",
    paris: "PAR",
    dubai: "DXB",
    singapore: "SIN",
    tokyo: "TYO",
    sydney: "SYD",
    barcelona: "BCN",
    rome: "ROM",
    amsterdam: "AMS",
    istanbul: "IST"
  };

  const q = (query || "").toLowerCase().trim();
  if (!q) return null;

  // direct exact match first
  if (cityMap[q]) return cityMap[q];

  // clean query and try substring matches so inputs like
  // "kenya hotels" or "hotels in nairobi" still match
  const cleaned = q.replace(/[^\w\s,]/g, " ").replace(/\s+/g, " ");
  for (const key of Object.keys(cityMap)) {
    if (cleaned.includes(key)) return cityMap[key];
  }

  return null;
}

function getDefaultCheckIn() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getDefaultCheckOut() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
}

export default axios.create({ baseURL, timeout: 15000 });