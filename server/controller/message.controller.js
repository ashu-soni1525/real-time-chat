import bcrypt from "bcryptjs";
import User from "../model/User.js";
import Message from "../model/message.js";
import cloudinary from "../lib/cloudinary.js"
import {io,userSocketMap} from "../server.js"
import admin from "../config/firebaseAdmin.js";



export const getUsersFromSidebar = async (req, res) => {
  try {
    const userId = req.user._id
    const users = await User.find({ _id: { $ne: userId } }).select("-password")
    const unseenMessages = {}
    const promises = users.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
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
    console.log("selectedUserId", selectedUserId)
    const myId = req.user._id
console.log("myId", myId)
    // 1️⃣ Get all messages between logged-in user and selected user
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 })

    // 2️⃣ Mark received messages as read
    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: myId,
           seen: false,
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

// export const sendMessage = async (req, res) => {
//   try {
//     const { text, image } = req.body
//     const receiverId = req.params.id
//     const senderId = req.user._id

// let imageUrl;
// if(image){
// const uploadResponse = await cloudinary.uploader.upload(image)
// imageUrl = uploadResponse.secure_url;
// }
// const newMessage = await Message.create({
//     senderId,
//     receiverId,
//     text,
//     image:imageUrl,
//       seen: false,
// })
// const receiverSocketId= userSocketMap[receiverId];
// console.log("receiverSocketId", receiverSocketId)
// if(receiverSocketId){
//     if(receiverSocketId){
//  io.to(receiverSocketId).emit("newMessage", newMessage)
//     }
// }
//  res.json({
//       success: true,
//       newMessage
//     })
//   } catch (error) {
//     console.log(error.message)
//      res.json({
//       success: false,
//       message: error.message,
//     })
//   }
// }


export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      seen: false,
    });

    const receiverSocketId = userSocketMap[receiverId];

    // 🔵 Socket.IO real-time notification
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    } else {
      // 🔴 Offline → send FCM push notification
      const receiver = await User.findById(receiverId);
      const tokens = receiver.fcmTokens || [];

      if (tokens.length > 0) {
        const payload = {
          notification: {
            title: `New message from ${req.user.fullName}`,
            body: text || "You received a new message",
          },
          data: {
            senderId: senderId.toString(),
            messageId: newMessage._id.toString(),
          },
        };

        await admin.messaging().sendToDevice(tokens, payload);
      }
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
