import mongoose from "mongoose";

const localHotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: String,
  country: { type: String, default: "Kenya" },
  phone: String,
  email: String,
  description: String,
  price: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("LocalHotel", localHotelSchema);
