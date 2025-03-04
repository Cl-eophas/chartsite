import {
  ManageAccountsOutlined,
  LocationOnOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { Box, Typography, Divider, useTheme, IconButton, TextField, Button } from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import { setLogin } from "state";

const UserWidget = ({ userId, picturePath }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    location: "",
    occupation: "",
    twitterUrl: "",
    linkedinUrl: "",
  });
  
  const { palette } = useTheme();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const loggedInUserId = user?._id;
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main = palette.neutral.main;

  const getUser = useCallback(async () => {
    if (!userId || !token) return;
    
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (userId === loggedInUserId) {
        dispatch(setLogin({ user: data, token }));
      }
      
      setEditForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        location: data.location || "",
        occupation: data.occupation || "",
        twitterUrl: data.twitterUrl || "",
        linkedinUrl: data.linkedinUrl || "",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }, [dispatch, token, userId, loggedInUserId]);

  const handleEditSubmit = useCallback(async () => {
    if (!userId || !token) return;
    
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });
      const updatedUser = await response.json();
      
      if (userId === loggedInUserId) {
        dispatch(setLogin({ user: updatedUser, token }));
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }, [dispatch, token, userId, loggedInUserId, editForm]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  if (!user) {
    return null;
  }

  const {
    firstName,
    lastName,
    location,
    occupation,
    viewedProfile,
    impressions,
    friends,
  } = user;

  const isOwnProfile = loggedInUserId === userId;

  return (
    <WidgetWrapper>
      {/* FIRST ROW */}
      <FlexBetween gap="0.5rem" pb="1.1rem">
        <FlexBetween gap="1rem">
          <UserImage image={picturePath} />
          <Box>
            {isEditing ? (
              <Box display="flex" flexDirection="column" gap="0.5rem">
                <TextField
                  size="small"
                  label="First Name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  sx={{ width: "200px" }}
                />
                <TextField
                  size="small"
                  label="Last Name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  sx={{ width: "200px" }}
                />
              </Box>
            ) : (
              <>
                <Typography variant="h4" color={dark} fontWeight="500">
                  {firstName} {lastName}
                </Typography>
                <Typography color={medium}>{friends.length} friends</Typography>
              </>
            )}
          </Box>
        </FlexBetween>
        {isOwnProfile && (
          <Box display="flex" gap="1rem">
            {isEditing ? (
              <>
                <Button
                  onClick={handleEditSubmit}
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: palette.primary.main,
                    color: palette.background.alt,
                    "&:hover": { backgroundColor: palette.primary.dark },
                  }}
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      location: user.location,
                      occupation: user.occupation,
                      twitterUrl: user.twitterUrl || "",
                      linkedinUrl: user.linkedinUrl || "",
                    });
                  }}
                  variant="outlined"
                  size="small"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <IconButton onClick={() => setIsEditing(true)}>
                <ManageAccountsOutlined />
              </IconButton>
            )}
          </Box>
        )}
      </FlexBetween>

      <Divider />

      {/* SECOND ROW */}
      <Box p="1rem 0">
        <Box display="flex" alignItems="center" gap="1rem" mb="0.5rem">
          <LocationOnOutlined fontSize="large" sx={{ color: main }} />
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            />
          ) : (
            <Typography color={medium}>{location}</Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap="1rem">
          <WorkOutlineOutlined fontSize="large" sx={{ color: main }} />
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={editForm.occupation}
              onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
            />
          ) : (
            <Typography color={medium}>{occupation}</Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* THIRD ROW */}
      <Box p="1rem 0">
        <FlexBetween mb="0.5rem">
          <Typography color={medium}>Who's viewed your profile</Typography>
          <Typography color={main} fontWeight="500">
            {viewedProfile}
          </Typography>
        </FlexBetween>
        <FlexBetween>
          <Typography color={medium}>Impressions of your post</Typography>
          <Typography color={main} fontWeight="500">
            {impressions}
          </Typography>
        </FlexBetween>
      </Box>

      <Divider />

      {/* FOURTH ROW */}
      <Box p="1rem 0">
        <Typography fontSize="1rem" color={main} fontWeight="500" mb="1rem">
          Social Profiles
        </Typography>

        <FlexBetween gap="1rem" mb="0.5rem">
          <FlexBetween gap="1rem">
            <img 
              src="../assets/twitter.png" 
              alt="twitter" 
              style={{ width: "25px", height: "25px" }}
            />
            <Box>
              <Typography color={main} fontWeight="500">
                Twitter
              </Typography>
              {isEditing ? (
                <TextField
                  size="small"
                  placeholder="Twitter URL"
                  value={editForm.twitterUrl}
                  onChange={(e) => setEditForm({ ...editForm, twitterUrl: e.target.value })}
                />
              ) : (
                <Button
                  onClick={() => user.twitterUrl && window.open(user.twitterUrl, "_blank")}
                  disabled={!user.twitterUrl}
                  sx={{ textTransform: "none", p: 0 }}
                >
                  <Typography color={medium}>
                    {user.twitterUrl ? "Visit Profile" : "Not Connected"}
                  </Typography>
                </Button>
              )}
            </Box>
          </FlexBetween>
        </FlexBetween>

        <FlexBetween gap="1rem">
          <FlexBetween gap="1rem">
            <img 
              src="../assets/linkedin.png" 
              alt="linkedin" 
              style={{ width: "25px", height: "25px" }}
            />
            <Box>
              <Typography color={main} fontWeight="500">
                Linkedin
              </Typography>
              {isEditing ? (
                <TextField
                  size="small"
                  placeholder="LinkedIn URL"
                  value={editForm.linkedinUrl}
                  onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                />
              ) : (
                <Button
                  onClick={() => user.linkedinUrl && window.open(user.linkedinUrl, "_blank")}
                  disabled={!user.linkedinUrl}
                  sx={{ textTransform: "none", p: 0 }}
                >
                  <Typography color={medium}>
                    {user.linkedinUrl ? "Visit Profile" : "Not Connected"}
                  </Typography>
                </Button>
              )}
            </Box>
          </FlexBetween>
        </FlexBetween>
      </Box>
    </WidgetWrapper>
  );
};

export default UserWidget;