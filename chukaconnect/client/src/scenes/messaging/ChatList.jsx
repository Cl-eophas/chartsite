import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemAvatar, ListItemText, Typography, Divider, Tab, Tabs } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";

const ChatList = ({ onSelectChat }) => {
  const [followedUsers, setFollowedUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.token);
  const loggedInUser = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const getFriends = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/users/${loggedInUser._id}/friends`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setFriends(data || []);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const getFollowedUsers = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/users/${loggedInUser._id}/following`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setFollowedUsers(data || []);
      } else {
        setError(data.message || "Failed to fetch followed users");
        console.error("Error fetching followed users:", data);
      }
    } catch (error) {
      setError("Failed to connect to server");
      console.error("Error fetching followed users:", error);
    }
  };

  useEffect(() => {
    if (loggedInUser?._id) {
      getFriends();
      getFollowedUsers();
      
      // Set up polling to check for updates every 10 seconds
      const interval = setInterval(() => {
        getFriends();
        getFollowedUsers();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [loggedInUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (error) {
    return (
      <Box
        sx={{
          width: '30%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111b21'
        }}
      >
        <Typography color="#e9edef">
          {error}
        </Typography>
      </Box>
    );
  }

  const displayUsers = activeTab === 0 ? friends : followedUsers;

  return (
    <Box
      sx={{
        width: '30%',
        borderRight: '1px solid #2f3b43',
        backgroundColor: '#111b21',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: "1rem",
          borderBottom: "1px solid #2f3b43"
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#aebac1",
            marginBottom: "0.5rem"
          }}
        >
          Messages
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: "1px solid #2f3b43",
          '& .MuiTab-root': {
            color: '#8696a0',
            '&.Mui-selected': {
              color: '#00a884'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#00a884'
          }
        }}
      >
        <Tab 
          label={`Friends (${friends.length})`}
          sx={{ width: '50%' }}
        />
        <Tab 
          label={`Following (${followedUsers.length})`}
          sx={{ width: '50%' }}
        />
      </Tabs>

      {/* User List */}
      <List sx={{ padding: 0, flexGrow: 1, overflowY: 'auto' }}>
        {Array.isArray(displayUsers) && displayUsers.map((user) => (
          <React.Fragment key={user._id}>
            <ListItem 
              button 
              onClick={() => onSelectChat(user)}
              sx={{
                '&:hover': {
                  backgroundColor: '#202c33'
                }
              }}
            >
              <ListItemAvatar>
                <UserImage image={user.picturePath} size="40px" />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography color="#e9edef">
                    {user.firstName} {user.lastName}
                  </Typography>
                }
                secondary={
                  <Typography color="#8696a0" variant="body2">
                    {user.occupation || "No status"}
                  </Typography>
                }
              />
            </ListItem>
            <Divider sx={{ backgroundColor: '#2f3b43' }} />
          </React.Fragment>
        ))}
        {Array.isArray(displayUsers) && displayUsers.length === 0 && (
          <Box
            sx={{
              padding: "1rem",
              textAlign: "center"
            }}
          >
            <Typography color="#8696a0">
              {activeTab === 0 ? "No friends yet" : "Not following anyone"}
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

export default ChatList;