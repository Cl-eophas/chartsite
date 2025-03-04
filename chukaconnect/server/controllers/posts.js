import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, caption, location } = req.body;
    const user = await User.findById(userId);
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location,
      caption,
      userPicturePath: user.picturePath,
      picturePath: req.files.picture ? req.files.picture[0].filename : "",
      clipPath: req.files.clip ? req.files.clip[0].filename : "",
      documentPath: req.files.document ? req.files.document[0].filename : "",
      audioPath: req.files.audio ? req.files.audio[0].filename : "",
      likes: {},
      comments: [],
      views: 0,
      shares: {},
      reposts: {},
      shareCount: {
        facebook: 0,
        twitter: 0,
        whatsapp: 0,
        linkedin: 0,
      },
    });
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
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
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
    res.status(404).json({ message: err.message });
  }
};

export const sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, platform } = req.body;
    const post = await Post.findById(id);

    // Increment share count for the platform
    if (platform && post.shareCount.hasOwnProperty(platform)) {
      post.shareCount[platform] += 1;
    }

    // Track who shared
    const isShared = post.shares.get(userId);
    if (!isShared) {
      post.shares.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { 
        shares: post.shares,
        shareCount: post.shareCount,
      },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const repostPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isReposted = post.reposts.get(userId);

    if (isReposted) {
      post.reposts.delete(userId);
    } else {
      post.reposts.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { reposts: post.reposts },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = await User.findById(req.user.id);
    
    const comment = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      text,
      likes: new Map(),
      replies: [],
    };

    const post = await Post.findById(id);
    post.comments.push(comment);
    const updatedPost = await post.save();

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const addReply = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const user = await User.findById(req.user.id);
    
    const reply = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      text,
      likes: new Map(),
    };

    const post = await Post.findById(id);
    const comment = post.comments.id(commentId);
    comment.replies.push(reply);
    const updatedPost = await post.save();

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const comment = post.comments.id(commentId);
    
    const isLiked = comment.likes.get(userId);
    if (isLiked) {
      comment.likes.delete(userId);
    } else {
      comment.likes.set(userId, true);
    }

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* DELETE POST */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is authorized to delete the post
    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};