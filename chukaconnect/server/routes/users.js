import express from "express";
import {
  getUser,
  getUserFollowers,
  getUserFollowing,
  getFriends,
  followUser,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/:id", verifyToken, getUser);
router.get("/:id/followers", verifyToken, getUserFollowers);
router.get("/:id/following", verifyToken, getUserFollowing);
router.get("/:id/friends", verifyToken, getFriends);

/* UPDATE */
router.patch("/:id/follow/:targetId", verifyToken, followUser);

export default router;