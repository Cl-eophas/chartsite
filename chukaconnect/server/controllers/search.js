import User from "../models/User.js";
import Post from "../models/Post.js";

export const search = async (req, res) => {
  try {
    console.log("Search Query:", req.query);
    const { q: query, type = "all" } = req.query;
    
    if (!query) {
      console.log("Search Error: No query provided");
      return res.status(400).json({ 
        error: "Search query is required",
        details: "Please provide a search term using the 'q' parameter"
      });
    }

    const searchRegex = new RegExp(query, "i");
    let results = { users: [], posts: [] };

    // Search users if type is "all" or "users"
    if (type === "all" || type === "users") {
      console.log("Searching users with regex:", searchRegex);
      results.users = await User.find({
        $or: [
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { location: { $regex: searchRegex } },
          { occupation: { $regex: searchRegex } },
        ],
      })
      .select("firstName lastName picturePath location occupation email")
      .limit(20);
      console.log("Found users:", results.users.length);
    }

    // Search posts if type is "all" or "posts"
    if (type === "all" || type === "posts") {
      console.log("Searching posts with regex:", searchRegex);
      results.posts = await Post.find({
        $or: [
          { description: { $regex: searchRegex } },
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
          { location: { $regex: searchRegex } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(20);
      console.log("Found posts:", results.posts.length);
    }

    // Log the total results found
    console.log("Total results:", {
      users: results.users.length,
      posts: results.posts.length
    });

    res.status(200).json(results);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ 
      error: "Failed to perform search",
      details: err.message
    });
  }
};

export const searchSuggestions = async (req, res) => {
  try {
    console.log("Search Suggestions Query:", req.query);
    const { q: query } = req.query;
    
    if (!query) {
      console.log("Search Suggestions Error: No query provided");
      return res.status(400).json({ 
        error: "Search query is required",
        details: "Please provide a search term using the 'q' parameter"
      });
    }

    const searchRegex = new RegExp(query, "i");
    console.log("Search regex:", searchRegex);
    
    // Get user suggestions
    console.log("Searching user suggestions...");
    const userSuggestions = await User.find({
      $or: [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { occupation: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    })
      .select("firstName lastName picturePath occupation email")
      .limit(5);
    console.log("Found user suggestions:", userSuggestions.length);

    // Get post suggestions
    console.log("Searching post suggestions...");
    const postSuggestions = await Post.find({
      $or: [
        { description: { $regex: searchRegex } },
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
      ],
    })
      .select("description picturePath firstName lastName")
      .sort({ createdAt: -1 })
      .limit(3);
    console.log("Found post suggestions:", postSuggestions.length);

    // Log the total suggestions found
    console.log("Total suggestions:", {
      users: userSuggestions.length,
      posts: postSuggestions.length
    });

    res.status(200).json({
      users: userSuggestions,
      posts: postSuggestions,
    });
  } catch (err) {
    console.error("Search Suggestions Error:", err);
    res.status(500).json({ 
      error: "Failed to get search suggestions",
      details: err.message
    });
  }
};
