import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";

const Friend = ({ friendId, name, subtitle, userPicturePath, isFollowing: initialIsFollowing = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);
  const [localIsFollowing, setLocalIsFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  // Update local state when prop or user's following list changes
  useEffect(() => {
    const isUserFollowing = user.following?.some(f => 
      (typeof f === 'object' ? f._id === friendId : f === friendId)
    );
    setLocalIsFollowing(isUserFollowing);
  }, [user.following, friendId, initialIsFollowing]);

  if (!user) return null;

  const handleFollow = async () => {
    if (!token || !user._id || !friendId) {
      console.error("Missing required data:", { token, userId: user._id, friendId });
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      setLocalIsFollowing(!localIsFollowing);

      const response = await fetch(
        `http://localhost:3001/users/${user._id}/follow/${friendId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLocalIsFollowing(localIsFollowing);
        throw new Error(data.message || "Failed to update follow status");
      }

      dispatch({
        type: "SET_USER",
        payload: data.user,
      });

    } catch (error) {
      console.error("Follow error:", error);
      setLocalIsFollowing(localIsFollowing);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size="55px" />
        <Box
          onClick={() => {
            navigate(`/profile/${friendId}`);
          }}
        >
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{
              "&:hover": {
                color: palette.primary.light,
                cursor: "pointer",
              },
            }}
          >
            {name}
          </Typography>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>
      {user._id !== friendId && (
        <Tooltip title={localIsFollowing ? "Unfollow" : "Follow"}>
          <IconButton
            onClick={handleFollow}
            disabled={isLoading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              backgroundColor: 'transparent',
              p: "0.6rem",
              opacity: isLoading ? 0.7 : 1,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: 'transparent',
                transform: "scale(1.1)",
              },
            }}
          >
            {localIsFollowing ? (
              <PersonRemoveOutlined 
                sx={{ 
                  color: isHovered ? palette.error.main : palette.primary.main,
                  fontSize: "2rem",
                  stroke: isHovered ? palette.error.main : palette.primary.main,
                  strokeWidth: 1
                }} 
              />
            ) : (
              <PersonAddOutlined 
                sx={{ 
                  color: palette.primary.main,
                  fontSize: "2rem",
                  stroke: palette.primary.main,
                  strokeWidth: 1
                }} 
              />
            )}
          </IconButton>
        </Tooltip>
      )}
    </FlexBetween>
  );
};

export default Friend;