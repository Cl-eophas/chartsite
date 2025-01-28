import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
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
  userPicturePath: {
    type: String,
    default: "",
  },
  comment: {
    type: String,
    required: true,
  },
}, { 
  timestamps: true,
  _id: true
});

const commentSchema = new mongoose.Schema({
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
  userPicturePath: {
    type: String,
    default: "",
  },
  comment: {
    type: String,
    required: true,
  },
  replies: {
    type: [replySchema],
    default: [],
  }
}, { 
  timestamps: true,
  _id: true
});

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
    location: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    picturePath: {
      type: String,
      default: "",
    },
    videoPath: {
      type: String,
      default: "",
    },
    audioPath: {
      type: String,
      default: "",
    },
    documentPath: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'none'],
      default: 'none'
    },
    fileName: {
      type: String,
      default: "",
    },
    userPicturePath: {
      type: String,
      default: "",
    },
    likes: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  { 
    timestamps: true,
    toJSON: { 
      getters: true,
      transform: function(doc, ret) {
        // Ensure likes is always a Map
        if (!ret.likes) {
          ret.likes = new Map();
        }
        // Convert comments array to include _id
        if (ret.comments) {
          ret.comments = ret.comments.map(comment => ({
            ...comment,
            _id: comment._id.toString(),
            replies: comment.replies ? comment.replies.map(reply => ({
              ...reply,
              _id: reply._id.toString()
            })) : []
          }));
        }
        return ret;
      }
    }
  }
);

// Add index for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'comments.createdAt': -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;