import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'document', 'audio'],
      default: 'text'
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

// Index for efficient querying of conversations
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

// Static method to get conversation between two users
MessageSchema.statics.getConversation = async function(user1Id, user2Id, limit = 50) {
  return this.find({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender', 'firstName lastName picturePath')
  .populate('recipient', 'firstName lastName picturePath');
};

// Static method to get recent conversations for a user
MessageSchema.statics.getRecentConversations = async function(userId) {
  try {
    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId provided');
    }
    
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const messages = await this.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { recipient: userObjectId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userObjectId] },
              then: "$recipient",
              else: "$sender"
            }
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$recipient", userObjectId] },
                    { $eq: ["$read", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          user: {
            _id: "$userDetails._id",
            firstName: "$userDetails.firstName",
            lastName: "$userDetails.lastName",
            picturePath: "$userDetails.picturePath"
          }
        }
      },
      {
        $limit: 20
      }
    ]);

    return messages;
  } catch (error) {
    console.error('Error in getRecentConversations:', error);
    throw error;
  }
};

const Message = mongoose.model("Message", MessageSchema);
export default Message;
