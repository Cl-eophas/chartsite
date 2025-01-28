import User from "../models/User.js";
import mongoose from "mongoose";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id)
      .select("-password")
      .populate("followers", "_id firstName lastName picturePath")
      .populate("following", "_id firstName lastName picturePath");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize arrays if they don't exist
    user.followers = user.followers || [];
    user.following = user.following || [];

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    const users = await User.find({
      $or: [
        { firstName: { $regex: searchTerm, $options: "i" } },
        { lastName: { $regex: searchTerm, $options: "i" } },
      ],
    });

    const formattedUsers = users.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    res.status(200).json(formattedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    // Get pending friend requests
    const pendingRequests = user.friendRequests.filter(request => request.status === 'pending');
    
    // Get user details for each request
    const requestUsers = await User.find({
      _id: { $in: pendingRequests.map(request => request.userId) }
    });

    const formattedRequests = requestUsers.map(requestUser => {
      const request = pendingRequests.find(r => r.userId === requestUser._id.toString());
      return {
        _id: requestUser._id,
        firstName: requestUser.firstName,
        lastName: requestUser.lastName,
        occupation: requestUser.occupation,
        location: requestUser.location,
        picturePath: requestUser.picturePath,
        timestamp: request.timestamp
      };
    });

    res.status(200).json(formattedRequests);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if friends array exists
    const friendIds = user.friends || [];
    
    // Get friends' details
    const friends = await User.find(
      { _id: { $in: friendIds } },
      { password: 0, email: 0, friends: 0 } // Exclude sensitive fields
    );

    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    console.error("Error in getUserFriends:", err);
    res.status(500).json({ error: "Failed to get user friends", details: err.message });
  }
};

export const getFriends = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Get the user with their following and followers arrays
    const user = await User.findById(id).lean();
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all following users with selected fields
    const followingUsers = await User.find(
      { _id: { $in: user.following || [] } },
      'firstName lastName picturePath occupation location'
    ).lean();

    // Get all followers with selected fields
    const followerUsers = await User.find(
      { _id: { $in: user.followers || [] } },
      'firstName lastName picturePath occupation location'
    ).lean();

    // Get mutual connections (users who follow each other)
    const mutualConnections = followerUsers.filter(follower => 
      (user.following || []).some(followingId => 
        followingId.toString() === follower._id.toString()
      )
    );

    // Create a map for quick lookups
    const userMap = new Map();
    followingUsers.forEach(user => userMap.set(user._id.toString(), user));
    followerUsers.forEach(user => userMap.set(user._id.toString(), user));

    // Get all unique connections as an array
    const allConnections = Array.from(userMap.values());

    res.status(200).json({
      mutualFriends: mutualConnections,
      allConnections: allConnections,
      _debug: {
        followingCount: followingUsers.length,
        followersCount: followerUsers.length,
        mutualCount: mutualConnections.length,
        totalCount: allConnections.length
      }
    });
  } catch (err) {
    console.error("Error in getFriends:", err);
    res.status(500).json({ 
      message: "Error fetching friends list", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/* FOLLOW/UNFOLLOW */
export const followUser = async (req, res) => {
  try {
    const { id, targetId } = req.params;
    console.log("Follow request received:", { id, targetId });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Check if trying to follow self
    if (id === targetId) {
      return res.status(400).json({ message: "Users cannot follow themselves" });
    }

    // Get both users with their following/followers arrays
    const [user, targetUser] = await Promise.all([
      User.findById(id).lean(),
      User.findById(targetId).lean()
    ]);

    // Check if both users exist
    if (!user || !targetUser) {
      return res.status(404).json({ message: "One or both users not found" });
    }

    // Initialize arrays if they don't exist
    user.following = user.following || [];
    user.followers = user.followers || [];
    targetUser.following = targetUser.following || [];
    targetUser.followers = targetUser.followers || [];

    // Check if already following
    const isFollowing = user.following.some(followId => 
      followId.toString() === targetId.toString()
    );

    console.log("Current follow status:", { isFollowing });

    let updatedUser;
    
    if (isFollowing) {
      // Unfollow
      console.log("Unfollowing user");
      updatedUser = await User.findByIdAndUpdate(
        id,
        { 
          $pull: { following: targetId },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      ).populate('following', 'firstName lastName picturePath occupation location')
       .populate('followers', 'firstName lastName picturePath occupation location')
       .select('-password');

      await User.findByIdAndUpdate(
        targetId,
        { 
          $pull: { followers: id },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );
    } else {
      // Follow
      console.log("Following user");
      updatedUser = await User.findByIdAndUpdate(
        id,
        { 
          $addToSet: { following: targetId },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      ).populate('following', 'firstName lastName picturePath occupation location')
       .populate('followers', 'firstName lastName picturePath occupation location')
       .select('-password');

      await User.findByIdAndUpdate(
        targetId,
        { 
          $addToSet: { followers: id },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );
    }

    // Ensure arrays are initialized in the response
    updatedUser.following = updatedUser.following || [];
    updatedUser.followers = updatedUser.followers || [];

    console.log("Updated user data:", {
      followingCount: updatedUser.following.length,
      followersCount: updatedUser.followers.length
    });

    res.status(200).json({
      user: updatedUser,
      message: isFollowing ? "Successfully unfollowed user" : "Successfully followed user"
    });

  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ 
      message: "Error processing follow request", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
};

export const getUserFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id)
      .populate("followers", "_id firstName lastName picturePath");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize followers array if it doesn't exist
    user.followers = user.followers || [];

    res.status(200).json(user.followers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id)
      .populate("following", "_id firstName lastName picturePath");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize following array if it doesn't exist
    user.following = user.following || [];

    res.status(200).json(user.following);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE */
export const sendFriendRequest = async (req, res) => {
  try {
    const { id, targetId } = req.params;
    const targetUser = await User.findById(targetId);

    // Check if request already exists
    const existingRequest = targetUser.friendRequests.find(
      request => request.userId === id
    );

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Add friend request
    targetUser.friendRequests.push({
      userId: id,
      status: 'pending',
      timestamp: new Date()
    });

    await targetUser.save();
    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const respondToFriendRequest = async (req, res) => {
  try {
    const { id, targetId } = req.params;
    const { accept } = req.body;
    
    const user = await User.findById(id);
    
    // Find and update the request
    const requestIndex = user.friendRequests.findIndex(
      request => request.userId === targetId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (accept) {
      // Accept request and add to following
      user.friendRequests[requestIndex].status = 'accepted';
      if (!user.following.includes(targetId)) {
        user.following.push(targetId);
      }
    } else {
      // Reject request
      user.friendRequests[requestIndex].status = 'rejected';
    }

    await user.save();

    // Get updated following list
    const following = await User.find({
      _id: { $in: user.following }
    });

    const formattedFollowing = following.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    res.status(200).json(formattedFollowing);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id, targetId } = req.params;
    
    console.log("Follow/Unfollow request:", { id, targetId });

    // Check if IDs are valid
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Can't follow yourself
    if (id === targetId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const user = await User.findById(id);
    const targetUser = await User.findById(targetId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Current following state:", {
      userFollowing: user.following,
      targetFollowers: targetUser.followers
    });

    // Convert following array to strings for comparison
    const userFollowing = user.following.map(id => id.toString());
    const isFollowing = userFollowing.includes(targetId);

    let updatedUser;
    let updatedTargetUser;

    if (isFollowing) {
      // Unfollow
      console.log("Unfollowing user");
      updatedUser = await User.findByIdAndUpdate(
        id,
        { $pull: { following: targetId } },
        { new: true }
      );
      updatedTargetUser = await User.findByIdAndUpdate(
        targetId,
        { $pull: { followers: id } },
        { new: true }
      );
    } else {
      // Follow
      console.log("Following user");
      updatedUser = await User.findByIdAndUpdate(
        id,
        { $addToSet: { following: targetId } },
        { new: true }
      );
      updatedTargetUser = await User.findByIdAndUpdate(
        targetId,
        { $addToSet: { followers: id } },
        { new: true }
      );
    }

    // Get updated user data with populated fields
    const populatedUser = await User.findById(id)
      .select('-password')
      .populate('following', '_id firstName lastName picturePath')
      .populate('followers', '_id firstName lastName picturePath');

    console.log("Updated following state:", {
      following: populatedUser.following,
      followers: populatedUser.followers
    });

    const followingCount = populatedUser.following.length;
    const followersCount = populatedUser.followers.length;

    // Return the updated following list and counts
    res.status(200).json({
      following: populatedUser.following.map(f => ({
        _id: f._id,
        firstName: f.firstName,
        lastName: f.lastName,
        picturePath: f.picturePath
      })),
      followers: populatedUser.followers.map(f => ({
        _id: f._id,
        firstName: f.firstName,
        lastName: f.lastName,
        picturePath: f.picturePath
      })),
      connections: followingCount + followersCount
    });

  } catch (err) {
    console.error("Follow/Unfollow error:", err);
    res.status(500).json({ message: "Error updating follow status", details: err.message });
  }
};

/* GET FOLLOWED USERS */
export const getFollowedUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.following) {
      user.following = [];
      await user.save();
      return res.status(200).json([]);
    }

    const followedUsers = await Promise.all(
      user.following.map((id) => User.findById(id))
    );

    const formattedUsers = followedUsers
      .filter(user => user) // Remove any null values
      .map(({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      });

    res.status(200).json(formattedUsers);
  } catch (err) {
    console.error("Get Followed Users Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* GET FOLLOW COUNTS */
export const getFollowCounts = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize arrays if they don't exist
    if (!user.following) user.following = [];

    const counts = {
      following: user.following.length
    };

    res.status(200).json(counts);
  } catch (err) {
    console.error("Get Follow Counts Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE SOCIAL PROFILES */
export const updateSocialProfiles = async (req, res) => {
  try {
    const { id } = req.params;
    const { twitter, linkedin } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update social profiles
    user.socialProfiles = {
      twitter: twitter || "",
      linkedin: linkedin || ""
    };

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    console.error("Update Social Profiles Error:", err);
    res.status(400).json({ message: err.message });
  }
};

/* INCREMENT PROFILE VIEWS */
export const incrementProfileView = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    // Increment viewedProfile count
    user.viewedProfile = (user.viewedProfile || 0) + 1;
    
    // Also increment impressions as profile view counts as an impression
    user.impressions = (user.impressions || 0) + 1;
    
    await user.save();

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};