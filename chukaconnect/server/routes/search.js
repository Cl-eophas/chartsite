import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { search, searchSuggestions } from "../controllers/search.js";

const router = express.Router();

router.get("/", verifyToken, search);
router.get("/suggestions", verifyToken, searchSuggestions);

export default router;
