import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Typography, Menu, MenuItem } from '@mui/material';
import { Send, MoreVert, Delete, EmojiEmotions, AttachFile } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import UserImage from 'components/UserImage';
import FlexBetween from 'components/FlexBetween';

const ChatWindow = ({ selectedUser, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const token = useSelector((state) => state.token);
  const loggedInUser = useSelector((state) => state.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(
        `http://localhost:3001/messages/${loggedInUser._id}/${selectedUser._id}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data);
        scrollToBottom();
        markMessagesAsRead();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser) return;

    try {
      await fetch(
        `http://localhost:3001/messages/read/${loggedInUser._id}/${selectedUser._id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;

    try {
      const response = await fetch(
        "http://localhost:3001/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            senderId: loggedInUser._id,
            receiverId: selectedUser._id,
            content: message,
          }),
        }
      );

      if (response.ok) {
        setMessage('');
        fetchMessages();
        if (onMessageSent) onMessageSent();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      const response = await fetch(
        `http://localhost:3001/messages/${selectedMessage._id}/${loggedInUser._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setMessages(messages.filter(msg => msg._id !== selectedMessage._id));
        handleCloseMenu();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleOpenMenu = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll for new messages
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  if (!selectedUser) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b141a'
        }}
      >
        <Typography color="#aebac1">
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0b141a'
      }}
    >
      {/* Chat Header */}
      <FlexBetween
        sx={{
          padding: "0.8rem 1rem",
          backgroundColor: '#202c33',
          borderBottom: "1px solid #2f3b43"
        }}
      >
        <FlexBetween gap="0.8rem">
          <UserImage image={selectedUser?.picturePath} size="40px" />
          <Box>
            <Typography color="#e9edef" fontWeight="500">
              {selectedUser?.firstName} {selectedUser?.lastName}
            </Typography>
            <Typography variant="body2" color="#8696a0">
              {selectedUser?.occupation || "online"}
            </Typography>
          </Box>
        </FlexBetween>
      </FlexBetween>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
          backgroundSize: 'contain',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#0b141a',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#374045',
            borderRadius: '3px',
          }
        }}
      >
        {messages.map((msg, index) => {
          const isSender = msg.senderId === loggedInUser._id;
          const showAvatar = !isSender && (index === 0 || messages[index - 1]?.senderId !== msg.senderId);
          
          return (
            <Box
              key={msg._id}
              sx={{
                alignSelf: isSender ? 'flex-end' : 'flex-start',
                maxWidth: '65%',
                position: 'relative',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end'
              }}
            >
              {!isSender && showAvatar && (
                <UserImage image={selectedUser?.picturePath} size="32px" />
              )}
              {!isSender && !showAvatar && (
                <Box sx={{ width: '32px' }} /> // Placeholder for alignment
              )}
              <Box
                sx={{
                  backgroundColor: isSender ? '#005c4b' : '#202c33',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '7.5px',
                  position: 'relative',
                  '&:hover': {
                    '& .message-options': {
                      display: 'block'
                    }
                  }
                }}
              >
                <Typography 
                  color="#e9edef"
                  sx={{
                    wordBreak: 'break-word',
                    fontSize: '0.9rem'
                  }}
                >
                  {msg.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#8696a0',
                    fontSize: '0.7rem',
                    marginTop: '0.2rem',
                    display: 'block',
                    textAlign: 'right'
                  }}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.isRead && isSender && (
                    <span style={{ marginLeft: '4px', color: '#53bdeb' }}>✓✓</span>
                  )}
                </Typography>
              </Box>
              {isSender && (
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenMenu(e, msg)}
                  className="message-options"
                  sx={{
                    color: '#8696a0',
                    display: 'none',
                    position: 'absolute',
                    right: '-30px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px'
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          padding: '0.8rem',
          backgroundColor: '#202c33',
          display: 'flex',
          gap: '0.8rem',
          alignItems: 'center'
        }}
      >
        <IconButton 
          sx={{ 
            color: '#8696a0',
            '&:hover': {
              color: '#e9edef'
            }
          }}
        >
          <EmojiEmotions />
        </IconButton>
        <IconButton 
          sx={{ 
            color: '#8696a0',
            '&:hover': {
              color: '#e9edef'
            }
          }}
        >
          <AttachFile />
        </IconButton>
        <TextField
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          variant="standard"
          sx={{
            backgroundColor: '#2a3942',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            '& .MuiInput-root': {
              color: '#e9edef',
              '&:before, &:after': {
                display: 'none'
              }
            },
            '& .MuiInputBase-input': {
              padding: '0.25rem 0'
            }
          }}
        />
        <IconButton 
          type="submit"
          disabled={!message.trim()}
          sx={{ 
            color: message.trim() ? '#00a884' : '#8696a0',
            '&:hover': {
              color: message.trim() ? '#02c499' : '#8696a0'
            }
          }}
        >
          <Send />
        </IconButton>
      </Box>

      {/* Message Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            backgroundColor: '#233138',
            color: '#e9edef',
            boxShadow: '0 2px 5px 0 rgba(11,20,26,.26),0 2px 10px 0 rgba(11,20,26,.16)'
          }
        }}
      >
        <MenuItem 
          onClick={handleDeleteMessage}
          sx={{
            fontSize: '0.9rem',
            padding: '0.5rem 1rem',
            '&:hover': {
              backgroundColor: '#182229'
            }
          }}
        >
          <Delete sx={{ marginRight: '0.8rem', fontSize: '1.2rem' }} />
          Delete Message
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatWindow;