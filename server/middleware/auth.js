
import jwt from "jsonwebtoken"
import User from "../model/User.js";




export const protectRoute = async (req, res,next) => {
try {
    const token = req.headers.token;
        const decoded = jwt.verify(token,process.env.JWT_TOKEN);

    const user = await User.findById(decoded.userId).select("-password")
    if(!user)  return res.status(201).json({
      success: false,
      message: "user not found",
    })
    req.user = user;
    next();
} catch (error) {
    console.log(error.message);
    return res.status(201).json({
      success: false,
      message: error.message,
    })
}
}

export const checkAuth = async (req, res) => {
res.json({
      success: true,
      user:req.user
    })
}