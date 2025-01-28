import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notifications.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getNotifications);
router.get("/unread", verifyToken, getUnreadCount);

/* UPDATE */
router.patch("/:notificationId/read", verifyToken, markAsRead);
router.patch("/read-all", verifyToken, markAllAsRead);

export default router;
