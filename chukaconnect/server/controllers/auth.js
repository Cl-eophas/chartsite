import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { sendSMS } from "../utils/smsService.js";
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

/* Rate limiting for password reset attempts */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: "Too many password reset attempts. Please try again later."
});

/* REGISTER USER */
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      picturePath,
      friends,
      location,
      occupation,
    } = req.body;

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: passwordHash,
      picturePath,
      friends,
      location,
      occupation,
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* LOGGING IN */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        msg: "Database connection is not ready. Please try again.",
        code: "DB_NOT_READY"
      });
    }

    // Simple query with explicit error handling
    const user = await User.findOne({ email: email })
      .select('+password')
      .maxTimeMS(15000) // 15 second timeout
      .exec()
      .catch(err => {
        console.error('MongoDB query error:', err);
        throw err;
      });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        msg: "User does not exist",
        code: "USER_NOT_FOUND" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        msg: "Invalid credentials",
        code: "INVALID_CREDENTIALS" 
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    // Convert to plain object and remove sensitive data
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetToken;
    delete userObj.resetTokenExpiry;
    delete userObj.resetAttempts;

    res.status(200).json({ 
      success: true,
      token, 
      user: userObj
    });
  } catch (err) {
    console.error('Login error:', err);
    
    if (err.name === 'MongoServerSelectionError') {
      return res.status(500).json({
        success: false,
        msg: "Unable to connect to database server. Please try again later.",
        code: "DB_CONNECTION_ERROR"
      });
    }
    
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(500).json({
        success: false,
        msg: "Database error occurred. Please try again.",
        code: "DB_ERROR"
      });
    }

    res.status(500).json({ 
      success: false,
      msg: "An unexpected error occurred. Please try again.",
      code: "UNKNOWN_ERROR",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/* FORGOT PASSWORD */
export const forgotPassword = async (req, res) => {
  try {
    console.log("\n=== Starting Forgot Password Process ===");
    const { identifier, method = 'email' } = req.body;
    const clientIp = req.ip;

    if (!identifier) {
      return res.status(400).json({ 
        error: "Email or phone number is required",
        suggestion: "Please provide your email address or phone number"
      });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    // Track the attempt regardless of whether user exists
    if (user) {
      await user.trackResetAttempt(clientIp);
      
      // Check if user has exceeded reset attempts
      if (!user.canAttemptReset()) {
        return res.status(429).json({
          error: "Too many reset attempts",
          suggestion: "Please try again after 24 hours"
        });
      }
    }

    // Generate reset token even if user doesn't exist (for security)
    const resetToken = jwt.sign(
      { userId: user?._id || 'dummy' },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // 15 minutes expiry
    );

    if (user) {
      try {
        // Save reset token and expiry
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
        user.preferredResetMethod = method;
        await user.save();

        // Send reset instructions based on method
        if (method === 'sms' && user.phone) {
          const resetCode = resetToken.substring(0, 6).toUpperCase();
          await sendSMS(
            user.phone,
            `Your ChukaConnect password reset code is: ${resetCode}. Valid for 15 minutes.`
          );
        } else {
          // Default to email if SMS not available or method is email
          await sendPasswordResetEmail(user.email, resetToken);
        }

        // Return success without revealing if user exists
        return res.status(200).json({
          message: "If an account exists with this identifier, you will receive reset instructions shortly.",
          // Only return these details in development
          ...(process.env.NODE_ENV === 'development' && {
            method: method,
            identifier: identifier,
            tokenExpiry: "15 minutes"
          })
        });
      } catch (error) {
        console.error("Error sending reset instructions:", error);
        
        // Clear reset token if sending fails
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        
        return res.status(500).json({
          error: "Unable to send reset instructions",
          suggestion: "Please try again later or contact support"
        });
      }
    }

    // Return same response even if user doesn't exist (for security)
    return res.status(200).json({
      message: "If an account exists with this identifier, you will receive reset instructions shortly."
    });

  } catch (err) {
    console.error("Password Reset Error:", err);
    return res.status(500).json({
      error: "Unable to process your request",
      suggestion: "Please try again later"
    });
  }
};

/* RESET PASSWORD */
export const resetPassword = async (req, res) => {
  try {
    console.log("\n=== Starting Password Reset Verification ===");
    const { token, code, newPassword } = req.body;

    if (!token && !code) {
      return res.status(400).json({
        error: "Reset token or code is required",
        suggestion: "Please provide the reset token or code from your email/SMS"
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        error: "New password is required",
        suggestion: "Please provide a new password"
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: "Password is too weak",
        suggestion: "Password must be at least 8 characters long and contain at least one uppercase letter and one number"
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      $or: [
        { resetToken: token },
        { resetToken: { $regex: new RegExp(code, 'i') } }
      ],
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
        suggestion: "Please request a new password reset link"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user's password and clear reset token
    user.password = passwordHash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.resetAttempts = { count: 0, lastAttempt: null, ipAddresses: [] };
    await user.save();

    console.log("Password successfully reset for user:", user.email);

    return res.status(200).json({
      message: "Password has been successfully reset",
      suggestion: "You can now log in with your new password"
    });

  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({
      error: "Failed to reset password",
      suggestion: "Please try again later or contact support"
    });
  }
};

/* UPDATE PROFILE */
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      location,
      occupation,
      currentPassword,
      newPassword,
    } = req.body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          error: "Current password is required to set a new password",
          suggestion: "Please provide your current password"
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ 
          error: "Current password is incorrect",
          suggestion: "Please check your current password and try again"
        });
      }

      // Validate new password strength
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          error: "Password is too weak",
          suggestion: "Password must be at least 8 characters long and contain at least one uppercase letter and one number"
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // If changing email, verify it's not already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          error: "Email already in use",
          suggestion: "Please use a different email address"
        });
      }
      user.email = email.toLowerCase();
    }

    // Update other fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (occupation) user.occupation = occupation;

    // Handle profile picture if included
    if (req.file) {
      user.picturePath = req.file.filename;
    }

    // Save updated user
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "Profile updated successfully",
      user: userResponse
    });
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({
      error: "Unable to update profile",
      suggestion: "Please try again later"
    });
  }
};
