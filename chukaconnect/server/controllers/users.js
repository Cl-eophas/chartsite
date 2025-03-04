import User from "../models/User.js";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (user.friends.includes(friendId)) {
      user.friends = user.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== id);
    } else {
      user.friends.push(friendId);
      friend.friends.push(id);
    }
    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE PROFILE */
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      location,
      occupation,
      twitterUrl,
      linkedinUrl
    } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (location) user.location = location;
    if (occupation) user.occupation = occupation;
    if (twitterUrl) user.twitterUrl = twitterUrl;
    if (linkedinUrl) user.linkedinUrl = linkedinUrl;

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* SEARCH */
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(200).json([]);
    }

    const searchRegex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
      ]
    }).select('_id firstName lastName picturePath').limit(10);

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error searching users", error: err.message });
  }
};