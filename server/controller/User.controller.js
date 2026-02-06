import bcrypt from "bcryptjs";
import User from "../model/User.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js"
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    // 1️⃣ Validate fields
    if (!fullName || !email || !password || !bio) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2️⃣ Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists",
      });
    }

    // 3️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4️⃣ Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    // 5️⃣ Generate token
    const token = generateToken(user._id);

    // 6️⃣ Success response
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
    console.error(error);
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


export const upadateProfile = async (req, res) => {
try {
  const {profilePic, bio, fullName}=req.body;
  const userId= req.user._id;
  let updatedUser;
  if(!profilePic){
    updatedUser = await User.findByIdAndUpdate(userId,{bio, fullName},{new:true});
  }else{
    const uplode = await cloudinary.uploder.upload(profilePic);
    updatedUser = await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url, bio ,fullName},{new:true})
return res.status(400).json({
        success: true,
        User: updatedUser,
      });
  }
} catch (error) {
  return res.status(400).json({
        success: false,
        message: error.message,
      });
}
};
