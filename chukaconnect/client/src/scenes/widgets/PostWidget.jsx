import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
  DeleteOutlined,
  SendOutlined,
  ReplyOutlined,
  InsertEmoticonOutlined,
  PlayArrowOutlined,
  PauseOutlined,
  GetAppOutlined,
  ArticleOutlined,
} from "@mui/icons-material";
import { 
  Box, 
  Divider, 
  IconButton, 
  Typography, 
  useTheme, 
  Button, 
  Menu, 
  MenuItem,
  TextField,
  Avatar,
  Collapse,
} from "@mui/material";
import EmojiPicker from 'emoji-picker-react';
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPost } from "state";
import { useNavigate } from "react-router-dom";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  videoPath,
  audioPath,
  documentPath,
  fileType,
  fileName,
  userPicturePath,
  likes,
  comments,
}) => {
  const [isComments, setIsComments] = useState(false);
  const [comment, setComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const user = useSelector((state) => state.user);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;
  const medium = palette.neutral.medium;

  const patchLike = async () => {
    const response = await fetch(`http://localhost:3001/posts/${postId}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      const response = await fetch(`http://localhost:3001/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: loggedInUserId,
          comment: comment.trim()
        }),
      });

      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
      setComment(""); // Clear input after posting
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddReply = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      const response = await fetch(`http://localhost:3001/posts/${postId}/comment/${commentId}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: loggedInUserId,
          comment: replyText.trim()
        }),
      });

      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
      setReplyText(""); // Clear input after posting
      setReplyingTo(null); // Close reply input
      setShowReplyEmojiPicker(false);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3001/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      
      if (response.ok) {
        // Find and remove the post from UI
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
          postElement.remove();
        } else {
          // If we're on the single post page, navigate back
          navigate("/home");
        }
      } else {
        const data = await response.json();
        console.error("Error deleting post:", data.message);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
    setAnchorEl(null);
  };

  const handleShowPost = () => {
    navigate(`/posts/${postId}`);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:3001/posts/${postId}/comment/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });

      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/posts/${postId}/comment/${commentId}/reply/${replyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUserId }),
        }
      );

      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
    } catch (error) {
      console.error("Error deleting reply:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${name}'s post`,
        text: description,
        url: window.location.href,
      }).catch(console.error);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const onEmojiClick = (emojiObject) => {
    const cursor = document.getElementById('comment-input').selectionStart;
    const text = comment;
    const newText = text.slice(0, cursor) + emojiObject.emoji + text.slice(cursor);
    setComment(newText);
  };

  const onReplyEmojiClick = (emojiObject) => {
    const cursor = document.getElementById('reply-input').selectionStart;
    const text = replyText;
    const newText = text.slice(0, cursor) + emojiObject.emoji + text.slice(cursor);
    setReplyText(newText);
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
  };

  const handleDownload = (filePath, fileName) => {
    const link = document.createElement('a');
    link.href = `http://localhost:3001/assets/${filePath}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <WidgetWrapper mb="2rem" className="post-widget" data-post-id={postId}>
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
        isFollowing={user.following?.some(f => 
          (typeof f === 'object' ? f._id === postUserId : f === postUserId)
        )}
      />
      <Typography color={main} sx={{ mt: "1rem", cursor: "pointer" }} onClick={handleShowPost}>
        {description}
      </Typography>

      {/* Image */}
      {fileType === 'image' && picturePath && (
        <Box
          sx={{
            mt: "0.75rem",
            position: "relative",
            width: "100%",
            paddingTop: "56.25%", // 16:9 aspect ratio
            overflow: "hidden",
            borderRadius: "0.75rem",
            backgroundColor: "rgba(0,0,0,0.1)", // Placeholder color
            cursor: "pointer",
          }}
          onClick={handleShowPost}
        >
          <img
            width="100%"
            height="100%"
            alt="post"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              objectFit: "cover",
              backgroundColor: "transparent",
            }}
            src={`http://localhost:3001/assets/${picturePath}`}
            loading="lazy"
          />
        </Box>
      )}

      {/* Video */}
      {fileType === 'video' && videoPath && (
        <Box
          sx={{
            mt: "0.75rem",
            width: "100%",
            paddingTop: "56.25%", // 16:9 aspect ratio
            position: "relative",
            borderRadius: "0.75rem",
            overflow: "hidden",
            backgroundColor: "rgba(0,0,0,0.1)", // Placeholder color
          }}
        >
          <video
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "0.75rem",
            }}
            controls
            preload="metadata"
          >
            <source src={`http://localhost:3001/assets/${videoPath}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>
      )}

      {/* Audio */}
      {fileType === 'audio' && audioPath && (
        <Box
          sx={{
            mt: "0.75rem",
            p: "1rem",
            backgroundColor: palette.background.alt,
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            minHeight: "64px", // Fixed height to prevent layout shifts
          }}
        >
          <IconButton
            onClick={handleAudioPlay}
            sx={{
              backgroundColor: primary,
              color: palette.background.alt,
              "&:hover": { backgroundColor: palette.primary.dark }
            }}
          >
            {isPlaying ? <PauseOutlined /> : <PlayArrowOutlined />}
          </IconButton>
          
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                width: "100%",
                height: "4px",
                backgroundColor: palette.neutral.light,
                borderRadius: "2px",
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  height: "100%",
                  backgroundColor: primary,
                  width: `${audioProgress}%`,
                  borderRadius: "2px",
                  transition: "width 0.1s linear",
                }}
              />
            </Box>
          </Box>

          <audio
            ref={audioRef}
            src={`http://localhost:3001/assets/${audioPath}`}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={handleAudioEnded}
            style={{ display: "none" }}
          />
        </Box>
      )}

      {/* Document */}
      {fileType === 'document' && documentPath && (
        <Box
          sx={{
            mt: "0.75rem",
            p: "1rem",
            backgroundColor: palette.background.alt,
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: palette.primary.light,
            }
          }}
          onClick={() => handleDownload(documentPath, fileName)}
        >
          <ArticleOutlined sx={{ fontSize: "2rem", color: primary }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: main, fontWeight: 500 }}>
              {fileName}
            </Typography>
            <Typography variant="body2" sx={{ color: medium }}>
              Click to download
            </Typography>
          </Box>
          <GetAppOutlined sx={{ color: primary }} />
        </Box>
      )}
      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike} sx={{ 
              color: isLiked ? "red" : medium,
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.1)",
                color: isLiked ? "red" : primary,
              }
            }}>
              {isLiked ? (
                <FavoriteOutlined sx={{ fontSize: "1.5rem" }} />
              ) : (
                <FavoriteBorderOutlined sx={{ fontSize: "1.5rem" }} />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton 
              onClick={() => setIsComments(!isComments)}
              sx={{ 
                color: medium,
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "scale(1.1)",
                  color: primary,
                }
              }}
            >
              <ChatBubbleOutlineOutlined sx={{ fontSize: "1.5rem" }} />
            </IconButton>
            <Typography>{comments.length}</Typography>
          </FlexBetween>

          <IconButton 
            onClick={handleShare}
            sx={{ 
              color: medium,
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.1)",
                color: primary,
              }
            }}
          >
            <ShareOutlined sx={{ fontSize: "1.5rem" }} />
          </IconButton>
        </FlexBetween>

        {postUserId === loggedInUserId && (
          <div>
            <IconButton 
              onClick={handleMenuClick}
              sx={{ 
                color: medium,
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "scale(1.1)",
                  color: palette.error.main,
                }
              }}
            >
              <DeleteOutlined sx={{ fontSize: "1.5rem" }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  backgroundColor: palette.background.alt,
                  color: palette.neutral.main,
                  mt: "0.5rem",
                  "& .MuiMenuItem-root": {
                    typography: "body1",
                    "&:hover": {
                      backgroundColor: palette.primary.light,
                      color: palette.primary.main,
                    },
                  },
                }
              }}
            >
              <MenuItem onClick={handleDelete}>
                <DeleteOutlined sx={{ mr: "0.5rem", fontSize: "1.2rem" }} />
                Delete Post
              </MenuItem>
            </Menu>
          </div>
        )}
      </FlexBetween>

      {isComments && (
        <Box mt="0.5rem">
          <Divider />
          
          {/* Comment Input Section */}
          <FlexBetween gap="1rem" p="1rem">
            <Avatar
              src={`http://localhost:3001/assets/${user.picturePath}`}
              sx={{ width: 36, height: 36 }}
            />
            <Box sx={{ position: 'relative', width: '100%' }}>
              <TextField
                id="comment-input"
                fullWidth
                multiline
                maxRows={4}
                variant="standard"
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                sx={{
                  backgroundColor: palette.neutral.light,
                  borderRadius: "2rem",
                  padding: "0.5rem 2rem",
                  "& .MuiInput-root": {
                    "&:before, &:after": {
                      display: "none",
                    },
                  },
                }}
              />
              {showEmojiPicker && (
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: '100%', 
                  right: 0,
                  zIndex: 1,
                  boxShadow: 3,
                }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </Box>
              )}
            </Box>
            <IconButton 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              sx={{ 
                color: medium,
                "&:hover": { color: primary }
              }}
            >
              <InsertEmoticonOutlined />
            </IconButton>
            <IconButton 
              onClick={handleAddComment}
              disabled={!comment.trim()}
              sx={{
                color: comment.trim() ? primary : medium,
                "&:hover": { 
                  color: comment.trim() ? palette.primary.dark : medium,
                  transform: comment.trim() ? "scale(1.1)" : "none",
                },
                transition: "all 0.2s",
              }}
            >
              <SendOutlined />
            </IconButton>
          </FlexBetween>

          {/* Comments List */}
          <Box p="1rem">
            {comments.map((comment, i) => (
              <Box key={comment._id || i}>
                <FlexBetween>
                  <Box sx={{ display: 'flex', gap: '1rem', width: '100%', mb: '0.5rem' }}>
                    <Avatar
                      src={`http://localhost:3001/assets/${comment.userPicturePath}`}
                      sx={{ width: 32, height: 32 }}
                    />
                    <Box sx={{ 
                      flex: 1,
                      backgroundColor: palette.neutral.light,
                      borderRadius: "1rem",
                      padding: "0.5rem 1rem",
                    }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: main,
                          mb: '0.25rem',
                        }}
                      >
                        {comment.firstName} {comment.lastName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: main,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {comment.comment}
                      </Typography>
                      
                      {/* Reply Button */}
                      <Button
                        size="small"
                        startIcon={<ReplyOutlined sx={{ fontSize: "1.2rem" }} />}
                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        sx={{ 
                          color: medium,
                          textTransform: 'none',
                          mt: '0.5rem',
                          "&:hover": {
                            color: primary,
                            backgroundColor: 'transparent',
                          }
                        }}
                      >
                        Reply
                      </Button>

                      {/* Replies Section */}
                      {comment.replies && comment.replies.length > 0 && (
                        <Box sx={{ ml: '1rem', mt: '0.5rem' }}>
                          {comment.replies.map((reply, j) => (
                            <Box key={reply._id || j} sx={{ 
                              display: 'flex', 
                              gap: '1rem', 
                              mb: '0.5rem',
                              backgroundColor: palette.background.alt,
                              borderRadius: "1rem",
                              padding: "0.5rem 1rem",
                              ml: "1rem"
                            }}>
                              <Avatar
                                src={`http://localhost:3001/assets/${reply.userPicturePath}`}
                                sx={{ width: 24, height: 24 }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography 
                                  variant="subtitle2" 
                                  sx={{ 
                                    fontWeight: 'bold',
                                    color: main,
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  {reply.firstName} {reply.lastName}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: main,
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  {reply.comment}
                                </Typography>
                                {(reply.userId === loggedInUserId || postUserId === loggedInUserId) && (
                                  <IconButton
                                    onClick={() => handleDeleteReply(comment._id, reply._id)}
                                    size="small"
                                    sx={{ 
                                      ml: '-8px',
                                      color: medium,
                                      "&:hover": {
                                        color: palette.error.main,
                                      }
                                    }}
                                  >
                                    <DeleteOutlined sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {/* Reply Input */}
                      <Collapse in={replyingTo === comment._id}>
                        <Box sx={{ display: 'flex', gap: '1rem', mt: '0.5rem', ml: '1rem' }}>
                          <Avatar
                            src={`http://localhost:3001/assets/${user.picturePath}`}
                            sx={{ width: 24, height: 24 }}
                          />
                          <Box sx={{ position: 'relative', width: '100%' }}>
                            <TextField
                              id="reply-input"
                              fullWidth
                              size="small"
                              multiline
                              maxRows={3}
                              variant="standard"
                              placeholder="Write a reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddReply(comment._id);
                                }
                              }}
                              sx={{
                                backgroundColor: palette.background.alt,
                                borderRadius: "2rem",
                                padding: "0.25rem 1rem",
                                "& .MuiInput-root": {
                                  "&:before, &:after": {
                                    display: "none",
                                  },
                                },
                              }}
                            />
                            {showReplyEmojiPicker && replyingTo === comment._id && (
                              <Box sx={{ 
                                position: 'absolute', 
                                bottom: '100%', 
                                right: 0,
                                zIndex: 1,
                                boxShadow: 3,
                              }}>
                                <EmojiPicker onEmojiClick={onReplyEmojiClick} />
                              </Box>
                            )}
                          </Box>
                          <IconButton 
                            onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                            size="small"
                            sx={{ 
                              color: medium,
                              "&:hover": { color: primary }
                            }}
                          >
                            <InsertEmoticonOutlined />
                          </IconButton>
                          <IconButton
                            onClick={() => handleAddReply(comment._id)}
                            disabled={!replyText.trim()}
                            size="small"
                            sx={{
                              color: replyText.trim() ? primary : medium,
                              "&:hover": { 
                                color: replyText.trim() ? palette.primary.dark : medium,
                                transform: replyText.trim() ? "scale(1.1)" : "none",
                              },
                              transition: "all 0.2s",
                            }}
                          >
                            <SendOutlined />
                          </IconButton>
                        </Box>
                      </Collapse>
                    </Box>
                  </Box>
                  {(comment.userId === loggedInUserId || postUserId === loggedInUserId) && (
                    <IconButton
                      onClick={() => handleDeleteComment(comment._id)}
                      size="small"
                      sx={{ 
                        color: medium,
                        "&:hover": {
                          color: palette.error.main,
                          transform: "scale(1.1)",
                        },
                        transition: "all 0.2s",
                      }}
                    >
                      <DeleteOutlined sx={{ fontSize: '1.2rem' }} />
                    </IconButton>
                  )}
                </FlexBetween>
                {i < comments.length - 1 && <Divider sx={{ my: '1rem' }} />}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default PostWidget;