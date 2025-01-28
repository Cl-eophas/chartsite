import Notification from "../models/Notification.js";
import User from "../models/User.js";

/* READ */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get user details for each notification
    const notificationsWithUsers = await Promise.all(
      notifications.map(async (notification) => {
        const initiator = await User.findById(notification.initiatorId).select(
          "firstName lastName picturePath"
        );
        return {
          ...notification.toObject(),
          initiator,
        };
      })
    );

    res.status(200).json(notificationsWithUsers);
  } catch (err) {
    console.error("Get Notifications Error:", err);
    res.status(500).json({ error: "Failed to get notifications" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({ count });
  } catch (err) {
    console.error("Get Unread Count Error:", err);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

/* UPDATE */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (err) {
    console.error("Mark as Read Error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark All as Read Error:", err);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};
