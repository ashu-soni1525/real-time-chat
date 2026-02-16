import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import axios from "axios";

export const registerForPushNotifications = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token) {
      console.log("🔥 FCM TOKEN:", token);

      // ✅ Send token to backend
      await axios.post("/api/auth/save-fcm-token", { token });
    }
  } catch (error) {
    console.error("FCM error:", error);
  }
};
