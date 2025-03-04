import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, TextField, IconButton, useTheme, Paper, Menu, MenuItem, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { 
  Send as SendIcon, 
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Forward as ForwardIcon,
  Reply as ReplyIcon,
  EmojiEmotions as EmojiIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import UserImage from "components/UserImage";
import EmojiPicker from 'emoji-picker-react';

const ChatPage = () => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [users, setUsers] = useState([]); // For forwarding messages
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const { palette } = useTheme();

  // Check if user is authenticated
  useEffect(() => {
    if (!token || !user) {
      navigate("/");
      return;
    }
  }, [token, user, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch other user's details
  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/users/${userId}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setOtherUser(data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setError("Failed to load user details");
      }
    };
    getUser();
  }, [userId, token]);

  // Fetch conversation messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/messages/conversation/${userId}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setError("Failed to load messages");
        setLoading(false);
      }
    };
    fetchMessages();
  }, [userId, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch friends list
  useEffect(() => {
    const getFriends = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/users/${user._id}/friends`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch friends');
        const data = await response.json();
        setFriends(data);
        setFilteredFriends(data);
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      }
    };
    if (user) getFriends();
  }, [user, token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch("http://localhost:3001/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: userId,
          content: newMessage,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      setMessages(prevMessages => [...prevMessages, data]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleMessageAction = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    try {
      const response = await fetch(`http://localhost:3001/messages/${selectedMessage._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to delete message');
      setMessages(messages.filter(msg => msg._id !== selectedMessage._id));
      handleCloseMenu();
    } catch (error) {
      console.error("Failed to delete message:", error);
      setError("Failed to delete message");
    }
  };

  const handleReplyMessage = () => {
    setReplyingTo(selectedMessage);
    handleCloseMenu();
  };

  const handleForwardMessage = () => {
    setForwardDialogOpen(true);
    handleCloseMenu();
  };

  const handleForwardToUser = async (recipientId) => {
    try {
      const response = await fetch("http://localhost:3001/messages/forward", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: selectedMessage._id,
          receiverId: recipientId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to forward message');
      setForwardDialogOpen(false);
    } catch (error) {
      console.error("Failed to forward message:", error);
      setError("Failed to forward message");
    }
  };

  // Handle search in forward dialog
  const handleSearchFriends = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = friends.filter(friend => 
      friend.firstName.toLowerCase().includes(query) ||
      friend.lastName.toLowerCase().includes(query)
    );
    setFilteredFriends(filtered);
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  if (!token || !user) {
    return null; // Return null while redirecting
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column" gap={2}>
        <Typography color="error">{error}</Typography>
        <IconButton onClick={() => navigate("/messages")}>
          <ArrowBackIcon /> Back to Messages
        </IconButton>
      </Box>
    );
  }

  if (!otherUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column" gap={2}>
        <Typography>User not found</Typography>
        <IconButton onClick={() => navigate("/messages")}>
          <ArrowBackIcon /> Back to Messages
        </IconButton>
      </Box>
    );
  }

  return (
    <Box p="2rem" height="calc(100vh - 100px)" display="flex" flexDirection="column">
      <FlexBetween mb={2}>
        <IconButton onClick={() => navigate("/messages")}>
          <ArrowBackIcon />
        </IconButton>
        <FlexBetween gap="1rem">
          <UserImage image={otherUser.picturePath} size="55px" />
          <Typography variant="h5" fontWeight="500">
            {`${otherUser.firstName} ${otherUser.lastName}`}
          </Typography>
        </FlexBetween>
        <Box width={40} /> {/* Spacer for alignment */}
      </FlexBetween>

      <Box
        flex={1}
        sx={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          mb: 2,
        }}
      >
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((message) => {
            const isOwn = message.sender && user && message.sender._id === user._id;
            return (
              <Box
                key={message._id}
                alignSelf={isOwn ? "flex-end" : "flex-start"}
                sx={{ maxWidth: "70%", position: "relative" }}
              >
                {message.replyTo && (
                  <Paper
                    sx={{
                      p: 1,
                      mb: 0.5,
                      backgroundColor: "rgba(0,0,0,0.05)",
                      borderLeft: `3px solid ${palette.primary.main}`,
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      {message.replyTo.content}
                    </Typography>
                  </Paper>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    backgroundColor: isOwn ? palette.primary.main : palette.background.alt,
                    color: isOwn ? palette.primary.contrastText : palette.neutral.main,
                    borderRadius: "1rem",
                    borderBottomRightRadius: isOwn ? "0.25rem" : "1rem",
                    borderBottomLeftRadius: !isOwn ? "0.25rem" : "1rem",
                  }}
                >
                  <Typography>{message.content}</Typography>
                  <FlexBetween>
                    <Typography variant="caption" color={isOwn ? "rgba(255,255,255,0.7)" : "textSecondary"}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMessageAction(e, message)}
                      sx={{ opacity: 0.7 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </FlexBetween>
                </Paper>
              </Box>
            );
          })
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <Typography color="textSecondary">No messages yet. Start a conversation!</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Preview */}
      {replyingTo && (
        <Paper
          sx={{
            p: 1,
            mb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="body2" color="textSecondary">
            Replying to: {replyingTo.content}
          </Typography>
          <IconButton size="small" onClick={() => setReplyingTo(null)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {/* Message Input */}
      <Paper
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: "0.25rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          borderRadius: "2rem",
        }}
      >
        <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <EmojiIcon />
        </IconButton>
        <TextField
          fullWidth
          variant="standard"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          InputProps={{ disableUnderline: true }}
        />
        <IconButton type="submit" color="primary">
          <SendIcon />
        </IconButton>
      </Paper>

      {/* Forward Dialog */}
      <Dialog 
        open={forwardDialogOpen} 
        onClose={() => setForwardDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography>Forward Message To</Typography>
            <IconButton onClick={() => setForwardDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search friends..."
              value={searchQuery}
              onChange={handleSearchFriends}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <Box
                    key={friend._id}
                    onClick={() => handleForwardToUser(friend._id)}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                      borderRadius: '8px',
                      mb: 1,
                    }}
                  >
                    <UserImage image={friend.picturePath} size="40px" />
                    <Box ml={2}>
                      <Typography>
                        {friend.firstName} {friend.lastName}
                      </Typography>
                      {friend.occupation && (
                        <Typography variant="body2" color="text.secondary">
                          {friend.occupation}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary" textAlign="center">
                  No friends found
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '80px',
            right: '20px',
            zIndex: 10,
            boxShadow: 3,
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 1,
              m: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={() => setShowEmojiPicker(false)}
              sx={{ 
                backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            searchPlaceholder="Search emoji..."
            previewConfig={{ showPreview: false }}
            width={320}
            height={400}
          />
        </Box>
      )}

      {/* Message Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleReplyMessage}>
          <ReplyIcon sx={{ mr: 1 }} /> Reply
        </MenuItem>
        <MenuItem onClick={handleForwardMessage}>
          <ForwardIcon sx={{ mr: 1 }} /> Forward
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatPage;
