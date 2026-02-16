import bcrypt from "bcryptjs";
import User from "../model/User.js";
import jwt from "jsonwebtoken";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js"
import admin from '../config/firebaseAdmin.js'; // Step 3 me banaya tha




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
    await User.findByIdAndUpdate(req.user._id, {
      fcmToken: null,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove FCM token",
    });
  }
};

export const saveFcmToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;

    await User.updateOne(
      { _id: userId },
      { fcmToken: token }
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
    // Fetch user's FCM token from DB
    const user = await User.findById(userId);

    if (!user || !user.fcmToken) {
      return res.status(400).json({ success: false, message: "User has no FCM token" });
    }

    // Send notification via Firebase Admin SDK
    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
    });

    res.json({ success: true, message: "Notification sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send notification" });
  }
};