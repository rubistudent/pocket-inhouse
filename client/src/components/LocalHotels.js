import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function LocalHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", price: "" });

  const fetchHotels = () => {
    setLoading(true);
    api.get("/hotels/local")
      .then(r => setHotels(r.data?.data || []))
      .catch(e => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHotels(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/hotels/local", { ...form });
      setForm({ name: "", address: "", city: "", price: "" });
      fetchHotels();
    } catch (err) {
      setError(err.message || "Add failed");
    }
  };

  return (
    <div>
      <h3>Local hotels (Kenya)</h3>
      <form onSubmit={submit} style={{ marginBottom: 12 }}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        <input placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <button type="submit">Add local hotel</button>
      </form>

      {loading && <div>Loading local hotels…</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul>
        {hotels.map(h => (
          <li key={h._id}>
            <strong>{h.name}</strong> — {h.city} {h.address ? `— ${h.address}` : ""} {h.price ? `— ${h.price}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
