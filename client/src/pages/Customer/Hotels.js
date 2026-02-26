import React from "react";
import HotelsSearch from "../../components/HotelsSearch";
export default function Hotels() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Hotels</h2>
      <div>
        <HotelsSearch />
      </div>
      {/* Local hotels hidden — using LiteAPI remote results only */}
    </div>
  );
}
