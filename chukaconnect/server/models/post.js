import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    userPicturePath: String,
    text: String,
    likes: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    userPicturePath: String,
    text: String,
    likes: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    replies: [replySchema],
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    location: String,
    caption: String,
    picturePath: String,
    clipPath: String,
    documentPath: String,
    audioPath: String,
    userPicturePath: String,
    likes: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    comments: [commentSchema],
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    reposts: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    shareCount: {
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      whatsapp: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;