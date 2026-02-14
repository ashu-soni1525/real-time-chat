import jwt from "jsonwebtoken";

// export const generateToken = (userID)=>{
//     const token = jwt.sign({userID},process.env.JWT_SECRET)
//     return token;
// }

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId.toString() },
    process.env.JWT_SECRET
  );
};