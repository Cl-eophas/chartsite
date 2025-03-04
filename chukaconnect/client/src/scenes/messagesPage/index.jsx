import { useState, useEffect, useCallback } from "react";
import { Box, Typography, useTheme, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.token);
  const { palette } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const loadConversations = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/messages/recent`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data);
      setError(null);

      // Check if we need to redirect to a specific chat
      if (location.state?.redirectTo) {
        navigate(`/messages/${location.state.redirectTo}`, { replace: true });
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, location.state, navigate]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (error) {
    return (
      <Box p="2rem">
        <Typography color="error" variant="h5" textAlign="center">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box p="2rem">
      <Typography variant="h4" color={palette.neutral.dark} fontWeight="500" mb="1.5rem">
        Messages
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : conversations.length === 0 ? (
        <Typography textAlign="center" color={palette.neutral.medium}>
          No users found
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap="1rem">
          {conversations.map((conversation) => (
            <WidgetWrapper key={conversation.conversationId}>
              <Friend
                friendId={conversation.otherUser._id}
                name={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                subtitle={conversation.lastMessage.content}
                userPicturePath={conversation.otherUser.picturePath}
                unreadCount={conversation.unreadCount}
                showMessageButton={true}
              />
            </WidgetWrapper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MessagesPage;