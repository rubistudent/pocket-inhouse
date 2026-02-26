import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaSearch, FaMapMarkerAlt, FaStar, FaHotel } from "react-icons/fa";

export default function Hotel() {
  const [hotels, setHotels] = useState([]);
  const [filtered, setFiltered] = useState([]); // Client-side filter for displayed page
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // New state for location search
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0); // API uses offset, usually 0, 1, ... check API docs. Booking.com usually: offset=0, offset=20...
  // Wait, booking-com15 usually takes 'offset' or 'page_number'. Let's assume offset increment by 20 or page_number.
  // The backend just passes query params. Let's try passing 'page_number' as 0, 1... 
  // If API uses offset, we might need to multiply by limit.
  // Let's assume page_number for now as per common RapidAPI wrappers.
  const [hasMore, setHasMore] = useState(true);

  const BACKEND_URL = "http://localhost:5000";

  // Debounce location search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (locationQuery.length > 2) {
        searchLocations(locationQuery);
      } else {
        setLocationResults([]);
        setShowLocationDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [locationQuery]);

  const searchLocations = async (query) => {
    setSearchingLocation(true);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/hotels/locations`, {
        params: { query }
      });
      // API returns array of objects directly? Or { data: [...] }?
      // Based on typical booking-com15 response: logic usually in data.
      setLocationResults(data || []);
      setShowLocationDropdown(true);
    } catch (err) {
      console.error("Location search failed", err);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.label || loc.name); // distinct usage depending on API response structure
    setShowLocationDropdown(false);
    // Reset hotels when location changes
    setHotels([]);
    setFiltered([]);
    setPage(0);
    setHasMore(true);
  };

  const formatDate = (d) => d.toISOString().slice(0, 10);

  const loadHotels = useCallback(async (isLoadMore = false) => {
    setErrorMsg("");
    setLoading(true);

    // Default to Kenya if no location selected? Or force selection?
    // Let's default to Kenya ID if nothing selected.
    // Kenya ID: -2141754
    const dest_id = selectedLocation ? selectedLocation.dest_id : "-2141754";
    const dest_type = selectedLocation ? selectedLocation.dest_type : "country";

    const today = new Date();
    const arrival = new Date(today);
    arrival.setDate(today.getDate() + 7); // 1 week from now
    const departure = new Date(today);
    departure.setDate(today.getDate() + 8);

    try {
      // If loading more, increment page. But since 'page' state updates are async, 
      // rely on current 'page' value passed or managed.
      // Better: use 'page' from state.

      const response = await axios.get(`${BACKEND_URL}/api/hotels/search`, {
        params: {
          dest_id,
          search_type: dest_type, // 'CITY', 'COUNTRY', etc. API usually expects 'search_type' or infers from dest_type? 
          // booking-com15 usually needs 'search_type' matching 'dest_type' (e.g. city -> CITY, country -> COUNTRY)
          // Or just 'dest_type' param.
          // Let's pass 'search_type' based on dest_type mapping.
          // Response from location search usually has 'dest_type'.
          adults: "1",
          children_age: "0,0",
          room_qty: "1",
          page_number: page, // Passing page number.
          units: "metric",
          temperature_unit: "c",
          languagecode: "en-us",
          currency_code: "USD", // Default to USD for now
          arrival_date: formatDate(arrival),
          departure_date: formatDate(departure),
        },
      });

      const data = response.data;
      // booking-com15 structure: data -> { result: [...], ... } or data -> { data: { hotels: [...] } }
      // Previous code used: response?.data?.data?.hotels 
      // Let's verify structure. The previous code was:
      // const hotelList = response?.data?.data?.hotels || [];
      // This implies the API structure.

      const hotelList = data?.data?.hotels || []; // Adjust based on actual API response

      if (hotelList.length === 0) {
        if (!isLoadMore) setErrorMsg("No hotels found for this location.");
        setHasMore(false);
      } else {
        if (isLoadMore) {
          setHotels(prev => [...prev, ...hotelList]);
          setFiltered(prev => [...prev, ...hotelList]);
        } else {
          setHotels(hotelList);
          setFiltered(hotelList);
        }
      }
    } catch (err) {
      console.error(err);
      if (!isLoadMore) setErrorMsg("Failed to load hotels.");
    } finally {
      setLoading(false);
    }
  }, [page, selectedLocation]);

  // Initial load? Maybe not. Let user search.
  // Or load default Kenya on mount.
  useEffect(() => {
    // If we want initial load:
    loadHotels();
    // eslint-disable-next-line
  }, []); // Run once on mount (defaults to Kenya)

  // Handle page change for Load More
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  // When page changes, trigger load if page > 0
  useEffect(() => {
    if (page > 0) {
      loadHotels(true);
    }
  }, [page, loadHotels]);

  // Client-side text filter
  const filterHotels = () => {
    const txt = search.trim().toLowerCase();
    if (!txt) return setFiltered(hotels);
    setFiltered(
      hotels.filter((h) =>
        h?.property?.name?.toLowerCase()?.includes(txt)
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6 font-[Poppins]">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-8 text-center select-none">
        🌍 Global Hotel Search
      </h1>

      {/* Search Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center max-w-5xl mx-auto relative z-20">

        {/* Location Autocomplete */}
        <div className="relative w-full md:w-1/3">
          <div className="flex items-center border border-blue-300 p-3 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
            <FaMapMarkerAlt className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Where are you going?"
              className="flex-1 outline-none text-gray-700"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onFocus={() => locationQuery.length > 2 && setShowLocationDropdown(true)}
            />
            {searchingLocation && <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>}
          </div>

          {showLocationDropdown && locationResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
              {locationResults.map((loc, idx) => (
                <div
                  key={idx}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex flex-col"
                  onClick={() => handleLocationSelect(loc)}
                >
                  <span className="font-medium text-gray-800">{loc.label || loc.name}</span>
                  <span className="text-xs text-gray-500">{loc.dest_type} • {loc.country}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load/Search Button */}
        <button
          onClick={() => { setPage(0); loadHotels(false); }}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition select-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
          ) : (
            <><FaSearch /> Search Hotels</>
          )}
        </button>

        {/* Name Filter */}
        <div className="flex w-full md:w-1/3 gap-2">
          <input
            type="text"
            placeholder="Filter by hotel name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg shadow-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
            onKeyDown={(e) => e.key === "Enter" && filterHotels()}
          />
          <button
            onClick={filterHotels}
            className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-md hover:bg-green-700 transition"
          >
            Filter
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-5xl mx-auto bg-red-100 text-red-700 border border-red-400 p-4 rounded mb-8 shadow-sm text-center">
          {errorMsg}
        </div>
      )}

      {/* Hotel Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
        {filtered.map((hotel, idx) => {
          const p = hotel.property;
          const img = p?.photoUrls?.[0] || "https://via.placeholder.com/400x250?text=No+Image";

          return (
            <div
              key={hotel.hotel_id || idx}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl hover:scale-[1.02] transform transition duration-300 flex flex-col h-full"
              onClick={() => setSelected(hotel)}
            >
              <div className="relative h-56">
                <img
                  src={img}
                  alt={p?.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-blue-800 shadow">
                  {p?.propertyClass ? `${p.propertyClass} Stars` : "Hotel"}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-2">{p?.name}</h2>

                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                    {p?.reviewScore ? p.reviewScore.toFixed(1) : "New"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {p?.reviewCount ? `(${p.reviewCount} reviews)` : ""}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-1 flex items-center gap-1">
                  <FaMapMarkerAlt className="text-gray-400" />
                  {p?.wishlistName || "Location info unavailable"}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Check availability</span>
                  <span className="text-blue-600 font-medium text-sm hover:underline">View Details →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hotels.length > 0 && hasMore && !loading && (
        <div className="text-center mb-12">
          <button
            onClick={handleLoadMore}
            className="bg-gray-800 text-white px-8 py-3 rounded-full shadow-lg hover:bg-gray-700 transform transition hover:-translate-y-1"
          >
            Load More Hotels
          </button>
        </div>
      )}

      {loading && hotels.length > 0 && (
        <div className="text-center mb-12 text-gray-500">Loading more...</div>
      )}

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white transition shadow-sm"
              onClick={() => setSelected(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {(() => {
              const p = selected.property;
              const img = p?.photoUrls?.[0] || "https://via.placeholder.com/600x400?text=No+Image";

              return (
                <div>
                  <div className="h-72 w-full relative">
                    <img
                      src={img}
                      alt={p?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-20">
                      <h2 className="text-3xl font-bold text-white shadow-sm">{p?.name}</h2>
                      <p className="text-white/90 flex items-center gap-1 mt-1">
                        <FaMapMarkerAlt /> {p?.wishlistName}
                      </p>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="bg-blue-50 px-4 py-2 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-blue-700">{p?.reviewScore?.toFixed(1) || "-"}</span>
                        <span className="text-xs text-blue-600 uppercase font-bold">Rating</span>
                      </div>
                      <div className="bg-yellow-50 px-4 py-2 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-yellow-700">{p?.propertyClass || "-"}</span>
                        <span className="text-xs text-yellow-600 uppercase font-bold">Stars</span>
                      </div>
                      <div className="bg-green-50 px-4 py-2 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-green-700">{p?.reviewCount || "0"}</span>
                        <span className="text-xs text-green-600 uppercase font-bold">Reviews</span>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-6">
                      {p?.description || "No description available for this property."}
                    </p>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <button
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                        onClick={() => alert("Booking functionality coming soon!")}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
