import { Box, Typography, useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import Navbar from "scenes/navbar";
import WidgetWrapper from "components/WidgetWrapper";

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const theme = useTheme();

  const getConversations = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/messages/conversations/${user._id}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      } else {
        setError(data.message || "Failed to fetch conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError("Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  }, [user._id, token]);

  const getMessages = useCallback(async (conversationId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/messages/${conversationId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      return data.success ? data.messages : [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }, [token]);

  useEffect(() => {
    if (user?._id && token) {
      getConversations();
    }
  }, [user?._id, token, getConversations]);

  useEffect(() => {
    const loadMessages = async () => {
      if (conversations.length > 0) {
        for (const conv of conversations) {
          const messages = await getMessages(conv._id);
          conv.messages = messages;
        }
        setConversations([...conversations]);
      }
    };
    loadMessages();
  }, [conversations, getMessages]);

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Box width="100%" padding="2rem 6%">
          <Typography>Loading conversations...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Navbar />
        <Box width="100%" padding="2rem 6%">
          <Typography color="error">{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Box width="100%" padding="2rem 6%" display="flex" gap="2rem">
        {conversations.length === 0 ? (
          <WidgetWrapper>
            <Typography>No conversations yet</Typography>
          </WidgetWrapper>
        ) : (
          conversations.map((conversation) => (
            <WidgetWrapper key={conversation._id}>
              <Typography>
                {conversation.participants
                  .filter((p) => p._id !== user._id)
                  .map((p) => p.firstName + " " + p.lastName)
                  .join(", ")}
              </Typography>
              {conversation.messages?.map((message) => (
                <Box key={message._id} margin="1rem 0">
                  <Typography
                    color={message.sender === user._id ? "primary" : "text"}
                  >
                    {message.content}
                  </Typography>
                </Box>
              ))}
            </WidgetWrapper>
          ))
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;
