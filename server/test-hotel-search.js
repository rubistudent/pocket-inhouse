import axios from "axios";

const BASE_URL = "http://localhost:5000/api/hotels";

async function testLocationSearch(query) {
    try {
        console.log(`Testing location search for "${query}"...`);
        const res = await axios.get(`${BASE_URL}/locations`, { params: { query } });
        console.log("Location Search Result Status:", res.status);
        console.log("Full Response Data:", JSON.stringify(res.data, null, 2));

        if (Array.isArray(res.data) && res.data.length > 0) {
            console.log("Found locations:", res.data.map(l => `${l.label || l.name} (${l.dest_id})`).slice(0, 3));
            return res.data[0];
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
            // Handle case where data is nested in .data
            console.log("Found locations (nested):", res.data.data.map(l => `${l.label || l.name} (${l.dest_id})`).slice(0, 3));
            return res.data.data[0];
        } else {
            console.log("No locations found or unexpected format.");
            return null;
        }
    } catch (err) {
        console.error("Location search failed:", err.message);
        if (err.response) console.error("Response data:", err.response.data);
    }
}

async function testHotelSearch(location) {
    const dest_id = location.dest_id;
    const search_type = location.search_type || "city";
    try {
        console.log(`Testing hotel search for dest_id "${dest_id}" with type "${search_type}"...`);
        const today = new Date();
        const arrival = new Date(today);
        arrival.setDate(today.getDate() + 7);
        const departure = new Date(today);
        departure.setDate(today.getDate() + 8);

        const params = {
            dest_id,
            search_type,
            adults: "1",
            room_qty: "1",
            arrival_date: arrival.toISOString().slice(0, 10),
            departure_date: departure.toISOString().slice(0, 10),
            currency_code: "USD"
        };

        const res = await axios.get(`${BASE_URL}/search`, { params });
        console.log("Hotel Search Result Status:", res.status);
        console.log("Full Hotel Search Response:", JSON.stringify(res.data, null, 2));
        const hotels = res.data?.data?.hotels || [];
        console.log(`Found ${hotels.length} hotels.`);
        if (hotels.length > 0) {
            console.log("First hotel:", hotels[0].property.name);
        }
    } catch (err) {
        console.error("Hotel search failed:", err.message);
        if (err.response) console.error("Response data:", err.response.data);
    }
}

const CITIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Naivasha", "Diani Beach", "Malindi"];

async function runTests() {
    console.log("Starting Kenya-wide Hotel Search...");

    for (const city of CITIES) {
        console.log(`\n--- Processing ${city} ---`);
        const location = await testLocationSearch(city);
        if (location) {
            await testHotelSearch(location);
        }
        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 1000));
    }
}

runTests();
