import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import { formatDistanceToNow } from "date-fns";

const MessageList = ({ messages, recipient, onMessageSent }) => {
  const [newMessage, setNewMessage] = useState("");
  const theme = useTheme();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch("http://localhost:3001/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          recipientId: recipient._id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        onMessageSent();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <Box>
      {/* Header */}
      <FlexBetween gap="1rem" mb="1rem">
        <FlexBetween gap="1rem">
          <UserImage image={recipient.picturePath} size="55px" />
          <Box>
            <Typography
              color={theme.palette.neutral.main}
              variant="h5"
              fontWeight="500"
            >
              {`${recipient.firstName} ${recipient.lastName}`}
            </Typography>
          </Box>
        </FlexBetween>
      </FlexBetween>

      {/* Messages */}
      <Box
        sx={{
          height: "60vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1rem",
          backgroundColor: theme.palette.background.alt,
          borderRadius: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {messages.map((message) => {
          const isOwnMessage = message.sender._id === user._id;

          return (
            <Box
              key={message._id}
              sx={{
                alignSelf: isOwnMessage ? "flex-end" : "flex-start",
                maxWidth: "70%",
              }}
            >
              <Box
                sx={{
                  backgroundColor: isOwnMessage
                    ? theme.palette.primary.main
                    : theme.palette.background.default,
                  color: isOwnMessage
                    ? theme.palette.primary.contrastText
                    : theme.palette.neutral.main,
                  padding: "0.75rem 1rem",
                  borderRadius: "1rem",
                  wordBreak: "break-word",
                }}
              >
                <Typography>{message.content}</Typography>
              </Box>
              <Typography
                fontSize="0.75rem"
                color={theme.palette.neutral.medium}
                sx={{ mt: "0.25rem" }}
              >
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: true,
                })}
              </Typography>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <form onSubmit={handleSendMessage}>
        <TextField
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" disabled={!newMessage.trim()}>
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </form>
    </Box>
  );
};

export default MessageList;
