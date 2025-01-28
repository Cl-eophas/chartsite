import { Box, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import UserWidget from "scenes/widgets/UserWidget";
import UpdateProfileForm from "./UpdateProfileForm";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { userId } = useParams();
  const token = useSelector((state) => state.token);
  const currentUser = useSelector((state) => state.user);
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const isOwnProfile = userId === currentUser._id;

  const getUser = async () => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    getUser();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="center"
        sx={{
          "& > *": { height: "fit-content" }
        }}
      >
        <Box 
          flexBasis={isNonMobileScreens ? "26%" : undefined}
          sx={{
            position: isNonMobileScreens ? "sticky" : "static",
            top: "2rem",
            maxHeight: isNonMobileScreens ? "calc(100vh - 4rem)" : "none",
            overflowY: isNonMobileScreens ? "auto" : "visible"
          }}
        >
          <UserWidget 
            userId={userId} 
            picturePath={user.picturePath} 
            isOwnProfile={isOwnProfile}
            onEditProfile={() => setIsEditing(true)}
          />
          <Box m="2rem 0" />
          <FriendListWidget userId={userId} />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          {isEditing && isOwnProfile ? (
            <UpdateProfileForm onCancel={() => setIsEditing(false)} />
          ) : (
            <>
              <MyPostWidget picturePath={user.picturePath} />
              <Box m="2rem 0" />
              <PostsWidget userId={userId} isProfile />
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;