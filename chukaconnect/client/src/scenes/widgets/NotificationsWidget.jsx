import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Button,
} from "@mui/material";
import {
  NotificationsOutlined,
  NotificationsActive,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  setNotifications,
  setUnreadCounts,
  markNotificationRead,
  markAllNotificationsRead,
} from "state";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useNavigate } from "react-router-dom";

const NotificationsWidget = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const notifications = useSelector((state) => state.notifications);
  const unreadCount = useSelector((state) => state.unreadNotifications);
  const token = useSelector((state) => state.token);

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;
  const primaryLight = palette.primary.light;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    getNotifications(); // Refresh notifications when opening
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotifications = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      dispatch(setNotifications({ notifications: data }));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const getUnreadCount = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/notifications/unread`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      dispatch(setUnreadCounts({ notifications: data.count }));
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    try {
      await fetch(
        `http://localhost:3001/notifications/${notification._id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch(markNotificationRead({ notificationId: notification._id }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    // Navigate based on notification type
    handleClose();
    if (notification.type === "like" || notification.type === "comment") {
      navigate(`/posts/${notification.postId}`);
    } else if (notification.type === "message") {
      navigate(`/messages/${notification.initiatorId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(
        `http://localhost:3001/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch(markAllNotificationsRead());
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  useEffect(() => {
    getUnreadCount();
    // Poll for new notifications every minute
    const interval = setInterval(getUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <IconButton onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? (
            <NotificationsActive sx={{ fontSize: "25px" }} />
          ) : (
            <NotificationsOutlined sx={{ fontSize: "25px" }} />
          )}
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: 360,
            maxHeight: 480,
          },
        }}
      >
        <Box p={2}>
          <FlexBetween>
            <Typography variant="h6" color={main}>
              Notifications
            </Typography>
            {notifications.some((n) => !n.read) && (
              <Button onClick={handleMarkAllRead} size="small">
                Mark all as read
              </Button>
            )}
          </FlexBetween>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography color={medium}>No notifications</Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.read ? "inherit" : primaryLight,
                "&:hover": {
                  backgroundColor: notification.read
                    ? "action.hover"
                    : primaryLight,
                },
              }}
            >
              <Box width="100%">
                <FlexBetween>
                  <Typography color={main}>{notification.content}</Typography>
                  {!notification.read && (
                    <CircleIcon
                      sx={{ fontSize: 8, color: palette.primary.main }}
                    />
                  )}
                </FlexBetween>
                <Typography variant="body2" color={medium}>
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
};

export default NotificationsWidget;
