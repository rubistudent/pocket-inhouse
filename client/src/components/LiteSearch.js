import React, { useState } from "react";
import { searchLite, bookLite } from "../services/lite";

export default function LiteSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [bookingMsg, setBookingMsg] = useState(null);

  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
    // request remote LiteAPI results and include local DB hotels via proxy
    const resp = await searchLite({ query, includeLocal: true });
    const data = resp.data?.data || resp.data;
      // data shape depends on liteAPI; show array or single
      const items = Array.isArray(data) ? data : data?.results || [];
      setResults(items);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (item) => {
    setBookingMsg(null);
    try {
      const payload = { propertyId: item.id || item.propertyId || item._id, guest: { name: "Guest" }, rooms: item.rooms || 1 };
      const resp = await bookLite(payload);
      setBookingMsg(JSON.stringify(resp.data));
    } catch (err) {
      setBookingMsg(err?.response?.data?.message || err.message || "Booking failed");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h4 className="font-semibold mb-3">Search LiteAPI Properties</h4>
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search e.g. Nairobi" className="flex-1 border rounded px-2 py-1" />
        <button className="bg-yellow-600 text-white px-3 py-1 rounded">Search</button>
      </form>

      {loading && <div>Searching…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-2">
        {results.length === 0 && !loading && <li className="text-sm text-gray-500">No remote properties</li>}
        {results.map((r, i) => {
          const img = r.image || r.photo || r.thumbnail || (r.images && r.images[0]) || (r.media && r.media[0]) || null;
          const imgSrc = img && typeof img === "string" ? img : img && img.url ? img.url : null;
          return (
            <li key={r.id || r._id || i} className="border rounded p-2">
              <div className="flex gap-3 items-start">
                <img src={imgSrc || "/placeholder-hotel.jpg"} alt={r.name || r.propertyName || "Property"} className="w-28 h-20 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-semibold">{r.name || r.propertyName || "Property"}</div>
                  <div className="text-sm text-gray-600">{r.city || r.location || r.address}</div>
                  <div className="mt-2">
                    <button onClick={() => handleBook(r)} className="bg-blue-600 text-white px-3 py-1 rounded">Book</button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {bookingMsg && <pre className="mt-3 text-xs bg-gray-100 p-2 rounded">{bookingMsg}</pre>}
    </div>
  );
}
