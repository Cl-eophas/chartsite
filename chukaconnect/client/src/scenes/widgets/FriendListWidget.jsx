import { Box, Typography, useTheme } from "@mui/material";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const FriendListWidget = ({ userId }) => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.token);
  const loggedInUser = useSelector((state) => state.user);
  const { palette } = useTheme();

  const getFriends = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:3001/users/${userId}/friends`,
        {
          method: "GET",
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch friends list");
      }

      const data = await response.json();
      console.log('Friends data:', data); // Debug log
      
      // Use mutual friends by default, fallback to all connections if no mutual friends
      const friendsList = data.mutualFriends?.length > 0 
        ? data.mutualFriends 
        : data.allConnections || [];
      
      // Add isFollowing flag to each friend
      const friendsWithFollowStatus = friendsList.map(friend => ({
        ...friend,
        isFollowing: loggedInUser.following?.some(f => 
          (typeof f === 'object' ? f._id === friend._id : f === friend._id)
        )
      }));
      
      setFriends(friendsWithFollowStatus);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setError(error.message);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getFriends();
  }, [userId, loggedInUser]); // Update when userId or loggedInUser changes

  if (isLoading) {
    return (
      <WidgetWrapper>
        <Typography color={palette.neutral.dark} variant="h5" fontWeight="500" sx={{ mb: "1.5rem" }}>
          Loading Friends...
        </Typography>
      </WidgetWrapper>
    );
  }

  if (error) {
    return (
      <WidgetWrapper>
        <Typography color={palette.neutral.dark} variant="h5" fontWeight="500" sx={{ mb: "1.5rem" }}>
          Error Loading Friends
        </Typography>
        <Typography color={palette.neutral.medium}>
          {error}
        </Typography>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper>
      <Typography
        color={palette.neutral.dark}
        variant="h5"
        fontWeight="500"
        sx={{ mb: "1.5rem" }}
      >
        Friend List
      </Typography>
      <Box 
        display="flex" 
        flexDirection="column" 
        gap="1.5rem"
        sx={{
          maxHeight: "calc(100vh - 20rem)",
          overflowY: "auto",
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": {
            width: "0.4rem",
          },
          "&::-webkit-scrollbar-track": {
            background: palette.background.alt,
          },
          "&::-webkit-scrollbar-thumb": {
            background: palette.neutral.medium,
            borderRadius: "0.4rem",
          },
          "& > *": {
            flexShrink: 0
          }
        }}
      >
        {friends.length > 0 ? (
          friends.map((friend) => (
            <Friend
              key={friend._id}
              friendId={friend._id}
              name={`${friend.firstName} ${friend.lastName}`}
              subtitle={friend.occupation}
              userPicturePath={friend.picturePath}
              isFollowing={friend.isFollowing}
            />
          ))
        ) : (
          <Typography color={palette.neutral.medium}>
            No friends to display
          </Typography>
        )}
      </Box>
    </WidgetWrapper>
  );
};

export default FriendListWidget;