import axios from "axios";
import HotelCache from "../models/HotelCache.js";
import LocalHotel from "../models/LocalHotel.js";

// const HOST = process.env.RAPIDAPI_HOST;
// const KEY = process.env.RAPIDAPI_KEY;

export const searchHotels = async (req, res) => {
  // Simply pass query params through; ensure required params exist (e.g., dest_id)
  try {
    const params = req.query;
    // optional: cache key creation
    const hash = JSON.stringify(params);
    const cached = await HotelCache.findOne({ paramsHash: hash });
    if (cached) return res.json({ cached: true, data: cached.response });

    const url = `https://${process.env.RAPIDAPI_HOST}/api/v1/hotels/searchHotels`;
    const { data } = await axios.get(url, {
      params,
      headers: {
        "x-rapidapi-host": process.env.RAPIDAPI_HOST,
        "x-rapidapi-key": process.env.RAPIDAPI_KEY
      }
    });


    // store in cache
    // Note: detailed caching strategy might need adjustment for pagination
    // For now, we only cache the first page or specific params
    await HotelCache.create({ destId: params.dest_id || "", paramsHash: hash, response: data, createdAt: new Date() });

    res.json(data);
  } catch (err) {
    console.error("Hotel search error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Hotel search failed", error: err?.response?.data || err.message });
  }
};

export const searchLocations = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const url = `https://${process.env.RAPIDAPI_HOST}/api/v1/hotels/searchDestination`;
    const { data } = await axios.get(url, {
      params: { query },
      headers: {
        "x-rapidapi-host": process.env.RAPIDAPI_HOST,
        "x-rapidapi-key": process.env.RAPIDAPI_KEY
      }
    });

    console.log("Location API Response:", JSON.stringify(data, null, 2));

    res.json(data);
  } catch (err) {
    console.error("Location search error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Location search failed", error: err?.response?.data || err.message });
  }
};

export const getHotelDetails = async (req, res) => {
  try {
    const params = req.query;
    const url = `https://${process.env.RAPIDAPI_HOST}/api/v1/hotels/getHotelDetails`;
    const { data } = await axios.get(url, {
      params,
      headers: {
        "x-rapidapi-host": process.env.RAPIDAPI_HOST,
        "x-rapidapi-key": process.env.RAPIDAPI_KEY
      }
    });
    res.json(data);
  } catch (err) {
    console.error("Hotel details error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Hotel details failed", error: err?.response?.data || err.message });
  }
};

export const listLocalHotels = async (req, res) => {
  try {
    // optional: allow filtering by city
    const { city } = req.query;
    const filter = { country: "Kenya" };
    if (city) filter.city = city;
    const hotels = await LocalHotel.find(filter).sort({ createdAt: -1 });
    res.json({ local: true, data: hotels });
  } catch (err) {
    console.error("List local hotels error:", err.message);
    res.status(500).json({ message: "Failed to list local hotels", error: err.message });
  }
};

export const addLocalHotel = async (req, res) => {
  try {
    const { name, address, city, country = "Kenya", phone, email, description, price } = req.body;
    if (!name) return res.status(400).json({ message: "Hotel name is required" });
    const hotel = await LocalHotel.create({ name, address, city, country, phone, email, description, price });
    res.status(201).json({ message: "Local hotel added", data: hotel });
  } catch (err) {
    console.error("Add local hotel error:", err.message);
    res.status(500).json({ message: "Failed to add local hotel", error: err.message });
  }
};
