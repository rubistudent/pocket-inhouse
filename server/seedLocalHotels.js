import dotenv from "dotenv";
import mongoose from "mongoose";
import LocalHotel from "./models/LocalHotel.js";

dotenv.config();

const hotels = [
  { name: "Savannah View Lodge", city: "Nairobi", address: "Karen Rd 12", price: 120 },
  { name: "Mara Riverside Camp", city: "Masai Mara", address: "Mara River", price: 180 },
  { name: "Diani Beach Resort", city: "Diani", address: "Shanzu Rd", price: 150 },
  { name: "Nakuru Garden Hotel", city: "Nakuru", address: "Lake Rd", price: 90 }
];

const run = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set in env");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    const count = await LocalHotel.countDocuments();
    if (count === 0) {
      await LocalHotel.insertMany(hotels);
      console.log("Inserted sample local hotels.");
    } else {
      console.log(`Local hotels already present (${count}) — skipping insert.`);
    }
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err.message);
    process.exit(1);
  }
};

run();
