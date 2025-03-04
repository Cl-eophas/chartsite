import { useState, useCallback } from "react";
import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
  RepeatOutlined,
  VisibilityOutlined,
  Facebook,
  Twitter,
  WhatsApp,
  LinkedIn,
  DeleteOutline,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Typography, useTheme, Button, Menu, MenuItem, TextField, Snackbar, Alert, CircularProgress } from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useDispatch, useSelector } from "react-redux";
import { setPost, setPosts } from "state";
import EmojiPicker from 'emoji-picker-react';

const formatTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  return `${Math.floor(diffInMonths / 12)}y ago`;
};

const PostWidget = ({
  postId,
  postUserId,
  name,
  caption,
  location,
  picturePath,
  clipPath,
  documentPath,
  audioPath,
  userPicturePath,
  likes,
  comments,
  views = 0,
  shares = {},
  reposts = {},
  shareCount = { facebook: 0, twitter: 0, whatsapp: 0, linkedin: 0 },
}) => {
  const [isComments, setIsComments] = useState(false);
  const [comment, setComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;
  const shareTotal = Object.values(shareCount).reduce((a, b) => a + b, 0);
  const isReposted = Boolean(reposts[loggedInUserId]);
  const repostCount = Object.keys(reposts).length;
  const isOwnPost = loggedInUserId === postUserId;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  const patchLike = useCallback(async () => {
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
  }, [postId, token, loggedInUserId, dispatch]);

  const handleShare = useCallback(async (platform) => {
    const response = await fetch(`http://localhost:3001/posts/${postId}/share`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId, platform }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
    setShareAnchorEl(null);

    // Share to social media
    const shareUrl = `${window.location.origin}/post/${postId}`;
    const shareText = `Check out this post by ${name}: ${caption}`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
        break;
      default:
        break;
    }
  }, [postId, token, loggedInUserId, name, caption, dispatch]);

  const handleRepost = useCallback(async () => {
    const response = await fetch(`http://localhost:3001/posts/${postId}/repost`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
  }, [postId, token, loggedInUserId, dispatch]);

  const handleComment = useCallback(async () => {
    const response = await fetch(`http://localhost:3001/posts/${postId}/comment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: comment }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
    setComment("");
    setShowEmojiPicker(false);
  }, [postId, token, comment, dispatch]);

  const handleReply = useCallback(async (commentId) => {
    const response = await fetch(`http://localhost:3001/posts/${postId}/comment/${commentId}/reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: replyText }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
    setReplyText("");
    setReplyingTo(null);
  }, [postId, token, replyText, dispatch]);

  const handleCommentLike = useCallback(async (commentId) => {
    const response = await fetch(`http://localhost:3001/posts/${postId}/comment/${commentId}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
  }, [postId, token, loggedInUserId, dispatch]);

  const handleDeletePost = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:3001/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      if (response.ok) {
        // Remove the post from the Redux store
        dispatch(setPosts(posts => posts.filter(post => post._id !== postId)));
        setNotification({
          open: true,
          message: "Post deleted successfully",
          severity: "success"
        });
      } else {
        const error = await response.json();
        console.error("Error deleting post:", error);
        
        // Handle specific error cases
        let errorMessage = "Failed to delete post";
        if (response.status === 404) {
          errorMessage = "Post not found or already deleted";
        } else if (response.status === 403) {
          errorMessage = "You are not authorized to delete this post";
        } else if (response.status === 401) {
          errorMessage = "Please log in again to delete this post";
          // Optionally redirect to login page
          // navigate("/");
        }
        
        setNotification({
          open: true,
          message: error.message || errorMessage,
          severity: "error"
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setNotification({
        open: true,
        message: "Network error. Please check your connection and try again.",
        severity: "error"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [postId, token, dispatch]);

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <WidgetWrapper m="2rem 0" data-postid={postId}>
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
      />
      <Typography color={main} sx={{ mt: "1rem" }}>
        {caption}
      </Typography>
      {picturePath && (
        <img
          width="100%"
          height="auto"
          alt="post"
          style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
          src={`http://localhost:3001/assets/${picturePath}`}
        />
      )}
      {clipPath && (
        <video
          width="100%"
          height="auto"
          controls
          style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
          src={`http://localhost:3001/assets/clips/${clipPath}`}
        />
      )}
      {documentPath && (
        <Box sx={{ mt: "0.75rem" }}>
          <a href={`http://localhost:3001/assets/documents/${documentPath}`} target="_blank" rel="noopener noreferrer">
            View Document
          </a>
        </Box>
      )}
      {audioPath && (
        <audio
          controls
          style={{ width: "100%", marginTop: "0.75rem" }}
          src={`http://localhost:3001/assets/audio/${audioPath}`}
        />
      )}
      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike}>
              {isLiked ? (
                <FavoriteOutlined sx={{ color: primary }} />
              ) : (
                <FavoriteBorderOutlined />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={() => setIsComments(!isComments)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{comments.length}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={handleRepost}>
              <RepeatOutlined sx={{ color: isReposted ? primary : main }} />
            </IconButton>
            <Typography>{repostCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={(e) => setShareAnchorEl(e.currentTarget)}>
              <ShareOutlined />
            </IconButton>
            <Typography>{shareTotal}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton>
              <VisibilityOutlined />
            </IconButton>
            <Typography>{views}</Typography>
          </FlexBetween>
        </FlexBetween>

        {isOwnPost && (
          <IconButton 
            onClick={handleDeletePost}
            disabled={isDeleting}
            sx={{ 
              color: palette.error.main,
              '&:hover': {
                color: palette.error.dark,
              },
              position: 'relative'
            }}
          >
            {isDeleting ? (
              <CircularProgress
                size={24}
                sx={{
                  color: palette.error.main,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            ) : (
              <DeleteOutline />
            )}
          </IconButton>
        )}
      </FlexBetween>

      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={() => setShareAnchorEl(null)}
      >
        <MenuItem onClick={() => handleShare('facebook')}>
          <Facebook sx={{ mr: 1 }} /> Facebook ({shareCount.facebook})
        </MenuItem>
        <MenuItem onClick={() => handleShare('twitter')}>
          <Twitter sx={{ mr: 1 }} /> Twitter ({shareCount.twitter})
        </MenuItem>
        <MenuItem onClick={() => handleShare('whatsapp')}>
          <WhatsApp sx={{ mr: 1 }} /> WhatsApp ({shareCount.whatsapp})
        </MenuItem>
        <MenuItem onClick={() => handleShare('linkedin')}>
          <LinkedIn sx={{ mr: 1 }} /> LinkedIn ({shareCount.linkedin})
        </MenuItem>
      </Menu>

      {isComments && (
        <Box mt="0.5rem">
          <FlexBetween>
            <TextField
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              sx={{ mr: 1 }}
            />
            <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              😊
            </IconButton>
            <Button
              disabled={!comment}
              onClick={handleComment}
              sx={{ ml: 1 }}
            >
              Post
            </Button>
          </FlexBetween>

          {showEmojiPicker && (
            <Box position="absolute" zIndex={1}>
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setComment(comment + emojiObject.emoji);
                }}
              />
            </Box>
          )}

          {comments.map((comment, i) => (
            <Box key={`${name}-${i}`}>
              <Divider sx={{ my: 1.5 }} />
              <FlexBetween>
                <Box>
                  <Typography sx={{ color: main, m: "0.5rem 0", pl: "1rem" }}>
                    <strong>{comment.firstName} {comment.lastName}</strong>: {comment.text}
                  </Typography>
                  <Typography sx={{ color: main, fontSize: "0.75rem", pl: "1rem" }}>
                    {formatTimeAgo(comment.createdAt)}
                  </Typography>
                  <FlexBetween sx={{ pl: "1rem" }}>
                    <IconButton onClick={() => handleCommentLike(comment._id)}>
                      {comment.likes[loggedInUserId] ? (
                        <FavoriteOutlined sx={{ color: primary, fontSize: "0.75rem" }} />
                      ) : (
                        <FavoriteBorderOutlined sx={{ fontSize: "0.75rem" }} />
                      )}
                    </IconButton>
                    <Button
                      size="small"
                      onClick={() => setReplyingTo(comment._id)}
                    >
                      Reply
                    </Button>
                  </FlexBetween>
                </Box>
              </FlexBetween>

              {/* Replies */}
              {comment.replies && comment.replies.map((reply, j) => (
                <Box key={`${name}-${i}-${j}`} sx={{ pl: 4 }}>
                  <Typography sx={{ color: main, m: "0.5rem 0" }}>
                    <strong>{reply.firstName} {reply.lastName}</strong>: {reply.text}
                  </Typography>
                  <Typography sx={{ color: main, fontSize: "0.75rem" }}>
                    {formatTimeAgo(reply.createdAt)}
                  </Typography>
                  <IconButton onClick={() => handleCommentLike(reply._id)}>
                    {reply.likes[loggedInUserId] ? (
                      <FavoriteOutlined sx={{ color: primary, fontSize: "0.75rem" }} />
                    ) : (
                      <FavoriteBorderOutlined sx={{ fontSize: "0.75rem" }} />
                    )}
                  </IconButton>
                </Box>
              ))}

              {/* Reply input */}
              {replyingTo === comment._id && (
                <FlexBetween sx={{ pl: 4, mt: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    sx={{ mr: 1 }}
                  />
                  <Button
                    disabled={!replyText}
                    onClick={() => handleReply(comment._id)}
                    size="small"
                  >
                    Reply
                  </Button>
                </FlexBetween>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </WidgetWrapper>
  );
};

export default PostWidget;