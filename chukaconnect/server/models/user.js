import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    picturePath: {
      type: String,
      default: "",
    },
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    location: String,
    occupation: String,
    viewedProfile: Number,
    impressions: Number,
  },
  { timestamps: true }
);

// Virtual field for following count
UserSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Virtual field for followers count
UserSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Method to check if a user is following another user
UserSchema.methods.isFollowing = function(userId) {
  return this.following.some(followingId => 
    followingId.toString() === userId.toString()
  );
};

const User = mongoose.model("User", UserSchema);
export default User;