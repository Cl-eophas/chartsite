import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res.status(403).send("Access Denied");
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified; // Store the full verified object which includes _id
      next();
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Internal server error in authentication" });
  }
};