import mongoose from "mongoose";
import dotenv from "dotenv";
import HotelCache from "./models/HotelCache.js";

dotenv.config({ path: "server/.env" });

const checkCachedHotels = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const cacheCount = await HotelCache.countDocuments();
        console.log(`\nTotal Cached Search Results: ${cacheCount}`);

        const caches = await HotelCache.find().sort({ createdAt: -1 }).limit(5);

        if (caches.length > 0) {
            console.log("\n--- Most Recent Cached Searches ---");
            caches.forEach((cache, index) => {
                console.log(`\n${index + 1}. DestID: ${cache.destId}`);
                console.log(`   Created At: ${cache.createdAt}`);

                // Inspect the response structure to find hotel count
                const data = cache.response;
                if (data && data.data && data.data.hotels) {
                    console.log(`   Hotels Found: ${data.data.hotels.length}`);
                    if (data.data.hotels.length > 0) {
                        console.log(`   Sample Hotel: ${data.data.hotels[0].property.name}`);
                    }
                } else if (Array.isArray(data)) {
                    // unexpected structure, usually response.data is the wrapper
                    console.log("   Data structure: Array");
                } else {
                    console.log("   Data structure: Unknown or empty");
                }
            });
        } else {
            console.log("No hotel data found in cache.");
        }

    } catch (error) {
        console.error("Error checking cache:", error);
    } finally {
        await mongoose.disconnect();
    }
};

checkCachedHotels();
