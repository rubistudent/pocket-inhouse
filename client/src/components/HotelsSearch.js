import React, { useState } from "react";
import api from "../services/api";
import { searchLite } from "../services/lite";

export default function HotelsSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      // Use lite proxy which returns remote results from LiteAPI and include local DB hotels
      const resp = await searchLite({ query, includeLocal: true });
      const data = resp.data?.data || resp.data || [];
      const items = Array.isArray(data) ? data : data?.results || data?.data || [data];
      setResults(items);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 p-4 bg-white rounded-lg shadow">
      <h3 className="text-2xl font-bold mb-3">Search Hotels</h3>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Nairobi, Zanzibar"
          className="flex-1 border rounded px-3 py-2"
        />
        <button className="bg-yellow-600 text-white px-4 py-2 rounded">Search</button>
      </form>

      {loading && <div>Searching…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-2">
        {results.length === 0 && !loading && <li>No hotels found</li>}
        {results.map((h, i) => {
          const img = h.image || h.photo || h.thumbnail || (h.images && h.images[0]) || (h.media && h.media[0]) || null;
          const imgSrc = img && typeof img === "string" ? img : img && img.url ? img.url : null;
          return (
            <li key={h._id || h.id || h.hotelId || i} className="p-3 border rounded">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <img
                    src={imgSrc || "/placeholder-hotel.jpg"}
                    alt={h.name || h.hotel_name || "Hotel"}
                    className="w-36 h-24 object-cover rounded"
                  />
                </div>
                <div>
                  <div className="font-semibold">{h.name || h.hotel_name || h.hotel || "Unnamed Hotel"}</div>
                  <div className="text-sm text-gray-600">{h.city || h.address || h.location || (h.address && `${h.address}`)}</div>
                  {h.price && <div className="text-sm text-gray-800">Price: {h.price}</div>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
