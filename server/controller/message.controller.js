import bcrypt from "bcryptjs";
import User from "../model/User.js";
import Message from "../model/message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import admin from "../config/firebase-admin.js";

/* =========================
   GET USERS (SIDEBAR)
========================= */
export const getUsersFromSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const users = await User.find({ _id: { $ne: userId } }).select("-password");

    const unseenMessages = {};

    await Promise.all(
      users.map(async (user) => {
        const count = await Message.countDocuments({
          senderId: user._id,
          receiverId: userId,
          seen: false,
        });

        if (count > 0) {
          unseenMessages[user._id] = count;
        }
      })
    );

    res.json({
      success: true,
      users,
      unseenMessages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET MESSAGES
========================= */
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    // Mark messages as seen
    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: myId,
        seen: false,
      },
      { $set: { seen: true } }
    );

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   MARK MESSAGE AS SEEN
========================= */
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;

    await Message.findByIdAndUpdate(id, { seen: true });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   SEND MESSAGE (SOCKET + FCM)
========================= */
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    /* 1️⃣ Upload image */
    let imageUrl = "";
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    /* 2️⃣ Save message */
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      seen: false,
    });

    /* 3️⃣ SOCKET (REALTIME UI) */
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    /* 4️⃣ 🔥 ALWAYS SEND FCM */
    const receiver = await User.findById(receiverId);
    console.log("receiver",receiver);

    if (receiver?.fcmTokens?.length) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: receiver.fcmTokens,
        notification: {
          title: `New message from ${req.user.fullName}`,
          body: text || "You received a new message",
        },
        data: {
          senderId: senderId.toString(),
          messageId: newMessage._id.toString(),
        },
      });
console.log("FCM response", response);
      // 🧹 remove dead tokens
      const invalidTokens = [];
      response.responses.forEach((r, i) => {
        if (
          !r.success &&
          r.error?.code ===
            "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(receiver.fcmTokens[i]);
        }
      });

      if (invalidTokens.length) {
        await User.updateOne(
          { _id: receiverId },
          { $pull: { fcmTokens: { $in: invalidTokens } } }
        );
      }
    }

    res.status(201).json({
      success: true,
      newMessage,
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
