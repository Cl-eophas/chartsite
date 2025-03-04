import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  searchUsers,
  updateProfile,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/search", verifyToken, searchUsers); // Search route must come before /:id route
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);

/* UPDATE */
router.patch("/:id", verifyToken, updateProfile); // Move this before the /:id/:friendId route
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);

export default router;