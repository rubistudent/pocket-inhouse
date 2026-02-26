import express from "express";
import { searchHotels, getHotelDetails, searchLocations, listLocalHotels, addLocalHotel } from "../controllers/hotelController.js";

const router = express.Router();

router.get("/search", searchHotels);
router.get("/locations", searchLocations);
router.get("/details", getHotelDetails);
router.get("/local", listLocalHotels);
router.post("/local", addLocalHotel);

export default router;
