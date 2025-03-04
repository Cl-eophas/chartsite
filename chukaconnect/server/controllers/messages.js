import Message from "../models/Message.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/* GET RECENT MESSAGES */
export const getRecentMessages = async (req, res) => {
    try {
        const userId = req.user._id;

        // First get all users to show in messages
        const users = await User.find({
            _id: { $ne: userId } // Exclude current user
        }).select('firstName lastName picturePath friends');

        // Get recent conversations
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { receiver: new mongoose.Types.ObjectId(userId) }
                    ],
                    deleted: false
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$$ROOT' }
                }
            }
        ]);

        // Count unread messages for each conversation
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiver: new mongoose.Types.ObjectId(userId),
                    read: false,
                    deleted: false
                }
            },
            {
                $group: {
                    _id: '$conversationId',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format response
        const formattedMessages = [];
        
        // Add all users to the list, even if no conversation exists
        for (const user of users) {
            const conversationId = [userId.toString(), user._id.toString()].sort().join('_');
            const conversation = messages.find(m => m._id === conversationId);
            const foundUnread = unreadCounts.find(uc => uc._id === conversationId);
            const unreadCount = foundUnread ? foundUnread.count : 0;

            formattedMessages.push({
                conversationId,
                otherUser: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    picturePath: user.picturePath
                },
                lastMessage: conversation ? {
                    _id: conversation.lastMessage._id,
                    content: conversation.lastMessage.content || "Start a conversation",
                    type: conversation.lastMessage.type || "text",
                    createdAt: conversation.lastMessage.createdAt || new Date(),
                    read: conversation.lastMessage.read || false
                } : {
                    content: "Start a conversation",
                    type: "text",
                    createdAt: new Date(),
                    read: true
                },
                unreadCount
            });
        }

        // Sort by last message date, with actual conversations first
        formattedMessages.sort((a, b) => {
            const aHasMessage = a.lastMessage.content !== "Start a conversation";
            const bHasMessage = b.lastMessage.content !== "Start a conversation";
            
            if (aHasMessage && !bHasMessage) return -1;
            if (!aHasMessage && bHasMessage) return 1;
            
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        res.status(200).json(formattedMessages);
    } catch (err) {
        console.error("Error in getRecentMessages:", err);
        res.status(500).json({ error: err.message });
    }
};

/* GET CONVERSATION */
export const getConversation = async(req, res) => {
    try {
        const userId = req.user._id;
        const { otherUserId } = req.params;
        const after = req.query.after; // For pagination/new messages

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(otherUserId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid user ID format"
            });
        }

        // First check if users exist
        const [sender, receiver] = await Promise.all([
            User.findById(userId),
            User.findById(otherUserId)
        ]);

        if (!sender || !receiver) {
            return res.status(404).json({
                status: 'error',
                message: "One or both users not found"
            });
        }

        const conversationId = [userId.toString(), otherUserId].sort().join('_');

        // Build query
        let query = {
            conversationId,
            deleted: false
        };

        // Add timestamp filter if 'after' parameter is provided
        if (after) {
            query.createdAt = { $gt: new Date(after) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: 1 }) // Sort by oldest first
            .populate('sender', 'firstName lastName picturePath')
            .populate('receiver', 'firstName lastName picturePath')
            .populate({
                path: 'replyTo',
                select: 'content type sender',
                populate: {
                    path: 'sender',
                    select: 'firstName lastName'
                }
            });

        // Mark messages as read if user is the receiver
        await Message.updateMany({
            conversationId,
            receiver: userId,
            read: false
        }, {
            $set: {
                read: true,
                readAt: new Date()
            }
        });

        return res.status(200).json(messages);
    } catch (err) {
        console.error("Error in getConversation:", err);
        return res.status(500).json({
            status: 'error',
            message: "Failed to fetch conversation"
        });
    }
};

/* SEND MESSAGE */
export const sendMessage = async(req, res) => {
    try {
        const { receiverId, content, type = 'text', replyToId } = req.body;
        const senderId = req.user._id;

        // Basic validation
        if (!receiverId || !content) {
            return res.status(400).json({
                status: 'error',
                message: "Receiver ID and content are required"
            });
        }

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid receiver ID format"
            });
        }

        // Convert IDs to ObjectId
        const senderObjectId = new mongoose.Types.ObjectId(senderId);
        const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
        const conversationId = [senderId.toString(), receiverId].sort().join('_');

        // Create message data
        const messageData = {
            sender: senderObjectId,
            receiver: receiverObjectId,
            content: content.trim(),
            type,
            conversationId,
            read: false,
            createdAt: new Date()
        };

        // Add replyTo if provided
        if (replyToId && mongoose.Types.ObjectId.isValid(replyToId)) {
            messageData.replyTo = new mongoose.Types.ObjectId(replyToId);
        }

        // Create and save message
        const newMessage = new Message(messageData);
        await newMessage.save();

        // Populate message data
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'firstName lastName picturePath')
            .populate('receiver', 'firstName lastName picturePath')
            .populate({
                path: 'replyTo',
                select: 'content type sender',
                populate: {
                    path: 'sender',
                    select: 'firstName lastName'
                }
            });

        if (!populatedMessage) {
            return res.status(500).json({
                status: 'error',
                message: "Message created but failed to retrieve details"
            });
        }

        return res.status(201).json({
            status: 'success',
            data: populatedMessage
        });

    } catch (err) {
        console.error("Error in sendMessage:", err);
        return res.status(500).json({
            status: 'error',
            message: err.message || "Failed to send message. Please try again."
        });
    }
};

/* REACT TO MESSAGE */
export const reactToMessage = async(req, res) => {
    try {
        const { messageId, reactionType } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ error: "Invalid message ID" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Find existing reaction from this user
        const existingReactionIndex = message.reactions.findIndex(
            reaction => reaction.user.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            // Update existing reaction
            message.reactions[existingReactionIndex].type = reactionType;
        } else {
            // Add new reaction
            message.reactions.push({
                user: userId,
                type: reactionType
            });
        }

        await message.save();
        res.status(200).json(message);
    } catch (err) {
        console.error("Error in reactToMessage:", err);
        res.status(500).json({ error: err.message });
    }
};

/* FORWARD MESSAGE */
export const forwardMessage = async(req, res) => {
    try {
        const { messageId, receiverId } = req.body;
        const senderId = req.user._id;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(messageId) ||
            !mongoose.Types.ObjectId.isValid(receiverId) ||
            !mongoose.Types.ObjectId.isValid(senderId)) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid ID format"
            });
        }

        // Get original message
        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) {
            return res.status(404).json({
                status: 'error',
                message: "Original message not found"
            });
        }

        // Create new message
        const newMessage = new Message({
            sender: new mongoose.Types.ObjectId(senderId),
            receiver: new mongoose.Types.ObjectId(receiverId),
            content: originalMessage.content,
            type: originalMessage.type,
            attachments: originalMessage.attachments,
            forwardedFrom: messageId,
            conversationId: [senderId.toString(), receiverId].sort().join('_'),
            isForwarded: true
        });

        await newMessage.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'firstName lastName picturePath')
            .populate('receiver', 'firstName lastName picturePath')
            .populate('forwardedFrom', 'content type sender')
            .populate({
                path: 'forwardedFrom',
                populate: {
                    path: 'sender',
                    select: 'firstName lastName'
                }
            });

        return res.status(201).json({
            status: 'success',
            data: populatedMessage
        });
    } catch (err) {
        console.error("Error in forwardMessage:", err);
        return res.status(500).json({
            status: 'error',
            message: "Failed to forward message"
        });
    }
};

/* DELETE MESSAGE */
export const deleteMessage = async(req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid message ID"
            });
        }

        const message = await Message.findOne({
            _id: messageId,
            sender: userId,
            deleted: false
        });

        if (!message) {
            return res.status(404).json({
                status: 'error',
                message: "Message not found or unauthorized"
            });
        }

        message.deleted = true;
        await message.save();
        
        return res.status(200).json({
            status: 'success',
            message: "Message deleted successfully"
        });
    } catch (err) {
        console.error("Error in deleteMessage:", err);
        return res.status(500).json({
            status: 'error',
            message: "Failed to delete message"
        });
    }
};

/* MARK AS READ */
export const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        // Validate messageId
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid message ID format"
            });
        }

        // Find and update the message
        const message = await Message.findOneAndUpdate(
            {
                _id: messageId,
                receiver: userId,
                read: false
            },
            {
                read: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                status: 'error',
                message: "Message not found or already read"
            });
        }

        res.status(200).json(message);
    } catch (err) {
        console.error("Error in markAsRead:", err);
        res.status(500).json({ error: err.message });
    }
};

/* UPLOAD FILE */
export const uploadFile = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user._id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                status: 'error',
                message: "No file uploaded"
            });
        }

        if (!receiverId) {
            return res.status(400).json({
                status: 'error',
                message: "Receiver ID is required"
            });
        }

        // Validate receiver ID
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid receiver ID format"
            });
        }

        const conversationId = [senderId.toString(), receiverId].sort().join('_');
        
        // Create message with file
        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content: file.path.replace('public/assets/', ''),
            type: file.mimetype.startsWith('image/') ? 'image' : 'file',
            conversationId,
            read: false,
            createdAt: new Date()
        });

        await message.save();

        // Populate sender and receiver details
        await message.populate('sender receiver', 'firstName lastName picturePath');

        res.status(201).json(message);
    } catch (err) {
        console.error("Error in uploadFile:", err);
        res.status(500).json({ error: err.message });
    }
};