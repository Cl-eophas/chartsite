import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getFeedPosts,
  getUserPosts,
  likePost,
  sharePost,
  repostPost,
  addComment,
  addReply,
  likeComment,
  incrementViews,
  deletePost,
} from "../controllers/posts.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);
router.patch("/:id/share", verifyToken, sharePost);
router.patch("/:id/repost", verifyToken, repostPost);
router.patch("/:id/view", verifyToken, incrementViews);

/* DELETE */
router.delete("/:id", verifyToken, deletePost);

/* COMMENTS */
router.post("/:id/comment", verifyToken, addComment);
router.post("/:id/comment/:commentId/reply", verifyToken, addReply);
router.patch("/:id/comment/:commentId/like", verifyToken, likeComment);

export default router;