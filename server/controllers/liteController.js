import { searchProperties, createBooking } from "../services/liteApi.js";
import LocalHotel from "../models/LocalHotel.js";

// Normalize Amadeus hotel response to standard format
function normalizeAmadeusHotels(hotels) {
  if (!Array.isArray(hotels)) hotels = [];
  return hotels.map(h => ({
    id: h.hotel?.hotelId || h.id,
    name: h.hotel?.name || "Hotel",
    city: h.hotel?.cityCode || "Unknown",
    address: h.hotel?.address?.streetNumber ? `${h.hotel.address.streetNumber} ${h.hotel.address.street}` : "N/A",
    price: h.offers?.[0]?.price?.total || "N/A",
    currency: h.offers?.[0]?.price?.currency || "USD",
    image: h.hotel?.image || null,
    rating: h.hotel?.rating || null,
    hotelId: h.hotel?.hotelId || h.id,
    _id: h.hotel?.hotelId || h.id
  }));
}

export const searchLiteProperties = async (req, res) => {
  try {
    const params = req.query || {};

    // call Amadeus API
    const extResp = await searchProperties(params);
    const extData = extResp?.data || extResp;

    // If client requested local merge, fetch local hotels from DB and merge
    const includeLocal = params.includeLocal === "true" || params.includeLocal === "1" || params.includeLocal === true;
    let localData = [];
    if (includeLocal) {
      const q = (params.query || params.city || params.q || "").toString();
      const filter = {};
      if (q) {
        const re = new RegExp(q, "i");
        filter.$or = [{ city: re }, { name: re }, { address: re }];
      }
      localData = await LocalHotel.find(filter).sort({ createdAt: -1 }).lean();
    }

    // Normalize Amadeus response format to array
    let extItems = [];
    if (Array.isArray(extData)) {
      // If it's already an array of Amadeus hotel objects, normalize them
      extItems = normalizeAmadeusHotels(extData);
    } else if (extData && Array.isArray(extData.data)) {
      // Amadeus returns {data: [...]}
      extItems = normalizeAmadeusHotels(extData.data);
    } else if (Array.isArray(extData?.results)) {
      extItems = extData.results;
    }

    const merged = includeLocal ? [...localData, ...extItems] : extItems;
    res.json({ ok: true, data: merged });
  } catch (err) {
    console.error("amadeus search error:", err?.response?.data || err.message);
    res.status(500).json({ ok: false, message: "Hotel search failed (Amadeus)", error: err?.response?.data || err.message });
  }
};

export const bookLite = async (req, res) => {
  try {
    const body = req.body;
    const { data } = await createBooking(body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    console.error("amadeus booking error:", err?.response?.data || err.message);
    res.status(500).json({ ok: false, message: "Booking failed", error: err?.response?.data || err.message });
  }
};
