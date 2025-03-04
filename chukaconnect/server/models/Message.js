import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "audio", "video", "document"],
      default: "text",
    },
    conversationId: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    originalMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        enum: ["like", "love", "laugh", "sad", "angry"],
      },
    }],
  },
  { timestamps: true }
);

// Create indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, read: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
