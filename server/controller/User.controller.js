import bcrypt from "bcryptjs";
import User from "../model/User.js";
import jwt from "jsonwebtoken";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js"
import admin from "../config/firebase-admin.js";




export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    
    if (!fullName || !email || !password || !bio) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ CHANGE 2: Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists",
      });
    }

    // ✅ CHANGE 3: Secure password hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ CHANGE 4: Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    // ✅ CHANGE 5: JWT payload must be an object
const token = generateToken(user._id);
    return res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4️⃣ Generate token
const token = generateToken(user._id);
    // 5️⃣ Success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        bio: user.bio,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body || {};
console.log("updateProfile body:", req.body);
    if (!fullName || !bio) {
      return res.status(400).json({
        success: false,
        message: "fullName and bio required",
      });
    }
    const userId = req.user._id;
console.log("updateProfile userId:", userId);
    const updateData = { fullName, bio };

    if (profilePic && profilePic.startsWith("data:image")) {
      const upload = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = upload.secure_url;
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: "-password" }
    );

    return res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateProfile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
};

export const removeFcmToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;

    if (!token) return res.status(400).json({ success: false, message: "Token required" });

    await User.findByIdAndUpdate(
      userId,
      { $pull: { fcmTokens: token } }, // 🔥 remove the token
      { new: true }
    );

    res.json({ success: true, message: "FCM token removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// export const saveFcmToken = async (req, res) => {
//   try {
//     console.log("🔥 req.user:", req.user); // ADD THIS
//     const userId = req.user?._id;
//     const { token } = req.body;

//     if (!userId) return res.status(401).json({ success: false, message: "User not authenticated" });
//     if (!token) return res.status(400).json({ success: false, message: "No token provided" });

//     await User.updateOne(
//       { _id: userId },
//       { $addToSet: { fcmTokens: token } }
//     );

//     res.json({ success: true, message: "FCM token saved" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


export const saveFcmToken = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { token } = req.body;

    if (!token) return res.status(400).json({ success: false, message: "Token required" });

    // Add token if not exists
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { fcmTokens: token } }, // 🔥 $addToSet avoids duplicates
      { new: true }
    );

    res.json({ success: true, message: "FCM token saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sendNotification = async (req, res) => {
  const { userId, title, body } = req.body;

  try {
    // Fetch user's FCM tokens from DB
    const user = await User.findById(userId);

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User has no FCM tokens" });
    }

    const payload = {
      notification: { title, body },
    };

    // Send notification to all tokens
    const response = await admin.messaging().sendToDevice(user.fcmTokens, payload);
console.log("Notification response:", response);
    res.json({ success: true, message: "Notification sent", response });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send notification", error: err.message });
  }
};
