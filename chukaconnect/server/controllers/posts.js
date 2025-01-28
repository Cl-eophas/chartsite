import Post from "../models/Post.js";
import User from "../models/User.js";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;
    const user = await User.findById(userId);
    
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      likes: {},
      comments: [],
    });

    if (req.file) {
      const fileType = req.body.fileType;
      const fileName = req.body.fileName;
      
      switch (fileType) {
        case 'image':
          newPost.picturePath = req.file.filename;
          break;
        case 'video':
          newPost.videoPath = req.file.filename;
          break;
        case 'audio':
          newPost.audioPath = req.file.filename;
          break;
        case 'document':
          newPost.documentPath = req.file.filename;
          break;
      }
      
      newPost.fileType = fileType;
      newPost.fileName = fileName;
    }

    await newPost.save();

    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(201).json(posts);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const post = await Post.find()
      .sort({ createdAt: -1 })
      .populate("userId", "-password");
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const post = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "-password");
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate("userId", "-password");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id || !userId) {
      return res.status(400).json({ error: "Post ID and User ID are required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Initialize likes as Map if it's undefined
    if (!post.likes) {
      post.likes = new Map();
    }

    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Like Post Error:", err);
    res.status(500).json({ error: "Failed to update post like status" });
  }
};

/* COMMENTS */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, comment } = req.body;

    if (!id || !userId || !comment) {
      return res.status(400).json({ error: "Post ID, User ID, and comment text are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Create new comment
    const newComment = {
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath || "",
      comment,
      replies: []
    };

    // Add comment to post
    post.comments.unshift(newComment); // Add to beginning of array
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    console.error("Add Comment Error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

export const addReply = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId, comment } = req.body;

    if (!id || !commentId || !userId || !comment) {
      return res.status(400).json({ error: "Post ID, Comment ID, User ID, and reply text are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Create new reply
    const newReply = {
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath || "",
      comment
    };

    // Add reply to comment
    post.comments[commentIndex].replies.unshift(newReply);
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    console.error("Add Reply Error:", err);
    res.status(500).json({ error: "Failed to add reply" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = req.body;

    if (!id || !commentId || !userId) {
      return res.status(400).json({ error: "Post ID, Comment ID, and User ID are required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Find the comment index
    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user is authorized to delete the comment
    const comment = post.comments[commentIndex];
    if (comment.userId !== userId && post.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    // Remove the comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    console.error("Delete Comment Error:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { id, commentId, replyId } = req.params;
    const { userId } = req.body;

    if (!id || !commentId || !replyId || !userId) {
      return res.status(400).json({ error: "Post ID, Comment ID, Reply ID, and User ID are required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const replyIndex = post.comments[commentIndex].replies.findIndex(
      reply => reply._id.toString() === replyId
    );

    if (replyIndex === -1) {
      return res.status(404).json({ error: "Reply not found" });
    }

    // Check if user is authorized to delete the reply
    const reply = post.comments[commentIndex].replies[replyIndex];
    if (reply.userId !== userId && post.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this reply" });
    }

    // Remove the reply
    post.comments[commentIndex].replies.splice(replyIndex, 1);
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    console.error("Delete Reply Error:", err);
    res.status(500).json({ error: "Failed to delete reply" });
  }
};

/* DELETE */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user is authorized to delete the post
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};