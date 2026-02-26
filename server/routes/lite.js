import express from "express";
import { searchLiteProperties, bookLite } from "../controllers/liteController.js";

const router = express.Router();

// GET /api/lite/search?query=...
router.get("/search", searchLiteProperties);

// POST /api/lite/book
router.post("/book", bookLite);

export default router;
