import express from "express";
import { login, register, forgotPassword, resetPassword, updateProfile } from "../controllers/auth.js";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.patch("/profile/:id", verifyToken, upload.single("picture"), updateProfile);

export default router;