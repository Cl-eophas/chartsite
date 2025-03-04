import { PersonAddOutlined, PersonRemoveOutlined, MessageOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { setFriends } from "state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";

const Friend = ({ friendId, name, subtitle, userPicturePath, unreadCount, showMessageButton = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  const isFriend = friends.find((friend) => friend._id === friendId);

  const patchFriend = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `http://localhost:3001/users/${_id}/${friendId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      dispatch(setFriends({ friends: data }));
    } catch (error) {
      console.error("Error updating friend status:", error);
    }
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${friendId}`);
  };

  const handleMessageClick = (e) => {
    e.stopPropagation();
    // Check if we're already on the messages page
    const isMessagesPage = location.pathname.startsWith('/messages');
    
    // If we're on the messages page, use the new route
    if (isMessagesPage) {
      navigate(`/messages/${friendId}`);
    } else {
      // If we're not on the messages page, go to messages first
      navigate('/messages', { state: { redirectTo: friendId } });
    }
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size="55px" onClick={handleUserClick} style={{ cursor: 'pointer' }} />
        <Box onClick={handleUserClick} sx={{ cursor: "pointer" }}>
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{
              "&:hover": {
                color: palette.primary.light,
              },
            }}
          >
            {name}
          </Typography>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
          {unreadCount > 0 && (
            <Typography color="primary" fontSize="0.75rem" fontWeight="bold">
              {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
            </Typography>
          )}
        </Box>
      </FlexBetween>
      <Box>
        <IconButton
          onClick={patchFriend}
          sx={{ 
            backgroundColor: primaryLight, 
            p: "0.6rem", 
            mr: "0.5rem",
            "&:hover": {
              backgroundColor: palette.primary.main,
              "& .MuiSvgIcon-root": {
                color: palette.background.alt,
              },
            },
          }}
        >
          {isFriend ? (
            <PersonRemoveOutlined sx={{ color: primaryDark }} />
          ) : (
            <PersonAddOutlined sx={{ color: primaryDark }} />
          )}
        </IconButton>
        {showMessageButton && (
          <IconButton
            onClick={handleMessageClick}
            sx={{ 
              backgroundColor: primaryLight, 
              p: "0.6rem",
              "&:hover": {
                backgroundColor: palette.primary.main,
                "& .MuiSvgIcon-root": {
                  color: palette.background.alt,
                },
              },
            }}
          >
            <MessageOutlined sx={{ color: primaryDark }} />
          </IconButton>
        )}
      </Box>
    </FlexBetween>
  );
};

export default Friend;