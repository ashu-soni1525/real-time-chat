import bcrypt from "bcryptjs";
import User from "../model/User.js";
import Message from "../model/message.js";
import cloudinary from "../lib/cloudinary.js"

// export const getUsersFromSidebar = async (req, res) => {
// try {
//     const userId = req.user._id;
//     const filteredUsers = await User.find({_id:{$ne: userId}}).select("-password")
// const unseenMessages={}
// const promises = filteredUsers.map(async ()=>{
//     const messages = await Message.find({senderId: user._id, reciverId:userId, seen: false})
// if(message.length > 0){
//     unseenMessages[user._id]= messages.length;
// }
// })
//     await Promise.all(promises)
//      res.json({
//         success: true,
//         users:filteredUsers,
//         unseenMessages
//       });
// } catch (error) {
//      res.json({
//         success: false,
//         message: error.message,
//       });
// }
// };

export const getUsersFromSidebar = async (req, res) => {
  try {
    const userId = req.user._id

    // Get all users except logged-in user
    const users = await User.find({ _id: { $ne: userId } }).select("-password")

    const unseenMessages = {}

    const promises = users.map(async (user) => {
      const messages = await Message.find({
        sender: user._id,
        receiver: userId,
        isRead: false,
      })

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length
      }
    })

    await Promise.all(promises)

    return res.json({
      success: true,
      users,
      unseenMessages,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}



export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params
    const myId = req.user._id

    // 1️⃣ Get all messages between logged-in user and selected user
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: selectedUserId },
        { sender: selectedUserId, receiver: myId },
      ],
    }).sort({ createdAt: 1 })

    // 2️⃣ Mark received messages as read
    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiver: myId,
      },
      {seen:true}
    )

    return res.json({
      success: true,
      messages,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}




export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params
    const myId = req.user._id

    await Message.findByIdAndUpdate(id, {seen:true})

    return res.json({
      success: true,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body
    const receiverId = req.params.id
    const senderId = req.user._id

let imageUrl;
if(image){
const uploadResponse = await cloudinary.uploader.upload(image)
imageUrl = uploadResponse.secure_url;
}
const newMessage = await Message.create({
    senderId,
    receiverId,
    text,
    image:imageUrl
})
 res.json({
      success: true,
    })
  } catch (error) {
    console.log(error.message)
     res.json({
      success: false,
      message: error.message,
    })
  }
}