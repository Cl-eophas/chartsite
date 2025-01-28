import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Popover,
} from "@mui/material";
import {
  Message as MessageIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  EmojiEmotions as EmojiIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  setMessages,
  addMessage,
  setUnreadCounts,
  setConversations,
  updateConversation,
} from "state";
import FlexBetween from "components/FlexBetween";
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';

const MessagesWidget = ({ initialSelectedUser = null, onClose = null }) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(initialSelectedUser);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);
  const conversations = useSelector((state) => state.conversations);
  const messages = useSelector((state) => state.messages);
  const unreadCount = useSelector((state) => state.unreadMessages);
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);

  const { palette } = useTheme();
  const medium = palette.neutral.medium;
  const primaryLight = palette.primary.light;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEmojiClose = useCallback(() => {
    setEmojiAnchorEl(null);
  }, []);

  const handleEmojiClick = useCallback((event) => {
    setEmojiAnchorEl(event.currentTarget);
  }, []);

  const onEmojiSelect = useCallback((emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    handleEmojiClose();
  }, [handleEmojiClose]);

  const getConversations = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(
        `http://localhost:3001/messages/recent`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      
      const data = await response.json();
      dispatch(setConversations({ conversations: data }));
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setError("Failed to load conversations");
    }
  }, [dispatch, token]);

  const getMessages = useCallback(async (userId) => {
    try {
      setError("");
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:3001/messages/conversation/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      
      const data = await response.json();
      dispatch(setMessages({ messages: data }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token]);

  const handleClick = useCallback(async (event) => {
    setAnchorEl(event.currentTarget);
    await getConversations();
  }, [getConversations]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedUser(null);
    setNewMessage("");
    setError("");
    setEditingMessage(null);
    setReplyingTo(null);
    if (onClose) onClose();
  }, [onClose]);

  const handleUserSelect = useCallback(async (conversation) => {
    setSelectedUser(conversation.user);
    await getMessages(conversation.user._id);
  }, [getMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    try {
      setError("");
      setIsLoading(true);
      
      const messageData = {
        receiverId: selectedUser._id,
        content: newMessage,
        contentType: newMessage.match(/[\u{1F300}-\u{1F9FF}]/gu) ? 
          (newMessage.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() ? "mixed" : "emoji") 
          : "text",
        replyTo: replyingTo?._id
      };

      const response = await fetch(
        "http://localhost:3001/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      const message = await response.json();
      dispatch(addMessage({ message }));
      dispatch(updateConversation({ userId: selectedUser._id, message }));
      setNewMessage("");
      setReplyingTo(null);
      await getConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token, selectedUser, newMessage, replyingTo, getConversations]);

  const handleEditMessage = useCallback(async (messageId, newContent) => {
    try {
      setError("");
      const response = await fetch(
        `http://localhost:3001/messages/${messageId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newContent }),
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to edit message");
      }
      
      await getMessages(selectedUser._id);
      setEditingMessage(null);
    } catch (error) {
      console.error("Failed to edit message:", error);
      setError("Failed to edit message");
    }
  }, [token, selectedUser, getMessages]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      setError("");
      const response = await fetch(
        `http://localhost:3001/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to delete message");
      }
      
      await getMessages(selectedUser._id);
    } catch (error) {
      console.error("Failed to delete message:", error);
      setError("Failed to delete message");
    }
  }, [token, selectedUser, getMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const getUnreadCount = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/messages/unread`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch unread count");
        }
        
        const data = await response.json();
        dispatch(setUnreadCounts({ messages: data.count }));
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    const fetchData = async () => {
      await getUnreadCount();
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [dispatch, token]);

  useEffect(() => {
    if (initialSelectedUser) {
      getMessages(initialSelectedUser._id);
    }
  }, [initialSelectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box
      sx={{
        position: initialSelectedUser ? 'fixed' : 'static',
        top: initialSelectedUser ? '50%' : 'auto',
        left: initialSelectedUser ? '50%' : 'auto',
        transform: initialSelectedUser ? 'translate(-50%, -50%)' : 'none',
        width: initialSelectedUser ? '80%' : '100%',
        maxWidth: '800px',
        maxHeight: initialSelectedUser ? '80vh' : 'none',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: initialSelectedUser ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      <Box p="1rem" sx={{ backgroundColor: palette.background.alt }}>
        <FlexBetween>
          <Typography color={medium} variant="h5">
            Messages {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          {initialSelectedUser && (
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          )}
        </FlexBetween>
      </Box>

      <IconButton onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <MessageIcon sx={{ fontSize: "25px" }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          style: {
            width: "400px",
            maxHeight: "80vh",
          },
        }}
      >
        {selectedUser ? (
          <Box>
            <FlexBetween p="1rem">
              <IconButton onClick={() => setSelectedUser(null)}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">
                {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              <Box width="25px" /> {/* Spacer */}
            </FlexBetween>
            <Divider />
            
            <Box
              sx={{
                height: "400px",
                overflowY: "auto",
                p: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {isLoading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                messages.map((message) => (
                  <Box
                    key={message._id}
                    sx={{
                      alignSelf: message.senderId === user._id ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                    }}
                  >
                    {replyingTo?._id === message._id && (
                      <Box
                        sx={{
                          bgcolor: "background.paper",
                          p: 1,
                          borderRadius: 1,
                          mb: 0.5,
                          border: `1px solid ${medium}`,
                        }}
                      >
                        <Typography variant="caption" color="textSecondary">
                          Replying to
                        </Typography>
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                      </Box>
                    )}
                    
                    {message.replyTo && (
                      <Box
                        sx={{
                          bgcolor: "background.paper",
                          p: 1,
                          borderRadius: 1,
                          mb: 0.5,
                          border: `1px solid ${medium}`,
                        }}
                      >
                        <Typography variant="caption" color="textSecondary">
                          Replied to
                        </Typography>
                        <Typography variant="body2">
                          {message.replyTo.content}
                        </Typography>
                      </Box>
                    )}

                    <Box
                      sx={{
                        bgcolor: message.senderId === user._id ? primaryLight : "background.paper",
                        p: 1,
                        borderRadius: 1,
                        position: "relative",
                      }}
                    >
                      {message.edited && (
                        <Typography variant="caption" color="textSecondary">
                          (edited)
                        </Typography>
                      )}
                      
                      {editingMessage?._id === message._id ? (
                        <Box>
                          <TextField
                            fullWidth
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            size="small"
                            multiline
                          />
                          <FlexBetween mt={1}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                handleEditMessage(message._id, newMessage);
                              }}
                            >
                              <SendIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingMessage(null);
                                setNewMessage("");
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </FlexBetween>
                        </Box>
                      ) : (
                        <>
                          <Typography>{message.content}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format(new Date(message.createdAt), 'HH:mm')}
                          </Typography>
                          
                          {message.senderId === user._id && (
                            <Box
                              sx={{
                                position: "absolute",
                                right: -30,
                                top: "50%",
                                transform: "translateY(-50%)",
                                opacity: 0,
                                transition: "opacity 0.2s",
                                "&:hover": { opacity: 1 },
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingMessage(message);
                                  setNewMessage(message.content);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMessage(message._id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                          
                          <IconButton
                            size="small"
                            onClick={() => setReplyingTo(message)}
                            sx={{
                              position: "absolute",
                              left: -30,
                              top: "50%",
                              transform: "translateY(-50%)",
                              opacity: 0,
                              transition: "opacity 0.2s",
                              "&:hover": { opacity: 1 },
                            }}
                          >
                            <ReplyIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>

            <Divider />
            
            {replyingTo && (
              <Box p={1} bgcolor={primaryLight}>
                <FlexBetween>
                  <Typography variant="body2">
                    Replying to: {replyingTo.content.substring(0, 50)}
                    {replyingTo.content.length > 50 ? "..." : ""}
                  </Typography>
                  <IconButton size="small" onClick={() => setReplyingTo(null)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </FlexBetween>
              </Box>
            )}

            <Box p="1rem">
              <FlexBetween>
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  multiline
                  maxRows={4}
                  sx={{ mr: 1 }}
                />
                <IconButton onClick={handleEmojiClick}>
                  <EmojiIcon />
                </IconButton>
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                >
                  <SendIcon />
                </IconButton>
              </FlexBetween>
            </Box>

            <Popover
              open={Boolean(emojiAnchorEl)}
              anchorEl={emojiAnchorEl}
              onClose={handleEmojiClose}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
            >
              <EmojiPicker onEmojiClick={onEmojiSelect} />
            </Popover>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" p="1rem">
              Messages
            </Typography>
            <Divider />
            {conversations.map((conversation) => (
              <MenuItem
                key={conversation.user._id}
                onClick={() => handleUserSelect(conversation)}
              >
                <FlexBetween sx={{ width: "100%" }}>
                  <FlexBetween gap="1rem">
                    <Avatar
                      src={`http://localhost:3001/assets/${conversation.user.picturePath}`}
                    />
                    <Box>
                      <Typography>
                        {conversation.user.firstName} {conversation.user.lastName}
                      </Typography>
                      {conversation.lastMessage && (
                        <Typography variant="body2" color="textSecondary">
                          {conversation.lastMessage.content.substring(0, 30)}
                          {conversation.lastMessage.content.length > 30 ? "..." : ""}
                        </Typography>
                      )}
                    </Box>
                  </FlexBetween>
                  {conversation.unreadCount > 0 && (
                    <Badge badgeContent={conversation.unreadCount} color="error" />
                  )}
                </FlexBetween>
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert onClose={() => setError("")} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MessagesWidget;
