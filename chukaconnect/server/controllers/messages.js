import Message from "../models/Message.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './public/uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// File upload handler
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      fileUrl,
      message: "File uploaded successfully"
    });
  } catch (err) {
    console.error("Error in uploadFile:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error uploading file",
      error: err.message 
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const deletedMessage = await Message.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (err) {
    console.error("Error in deleteMessage:", err);
    res.status(500).json({ 
      success: false,
      message: "Error deleting message",
      error: err.message 
    });
  }
}
export const uploadAudio = async (req, res) => { 
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No audio file uploaded" 
      });
    }

    const audioUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      audioUrl,
      message: "Audio uploaded successfully"
    });
  } catch (err) {
    console.error("Error in uploadAudio:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error uploading audio",
      error: err.message 
    });
  }
};

export const createMessage = async (req, res) => {
  try {
    const { recipient, content, type = 'text' } = req.body;
    const sender = req.user.id;

    const newMessage = new Message({
      sender,
      recipient,
      content,
      type,
      read: false
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'firstName lastName picturePath')
      .populate('recipient', 'firstName lastName picturePath');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    console.error("Error in createMessage:", err);
    res.status(500).json({ 
      success: false,
      message: "Error creating message",
      error: err.message 
    });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { userId, recipientId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName picturePath')
    .populate('recipient', 'firstName lastName picturePath');

    res.status(200).json({
      success: true,
      messages
    });
  } catch (err) {
    console.error("Error in getConversation:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching conversation",
      error: err.message 
    });
  }
};

export const getUnreadMessageCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          recipient: new mongoose.Types.ObjectId(userId),
          read: false
        }
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadCountMap = {};
    unreadCounts.forEach(item => {
      unreadCountMap[item._id.toString()] = item.count;
    });

    res.status(200).json({
      success: true,
      unreadCounts: unreadCountMap
    });
  } catch (err) {
    console.error("Error in getUnreadMessageCount:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching unread counts",
      error: err.message 
    });
  }
};
