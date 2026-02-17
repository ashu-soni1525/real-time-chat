import { onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

export const initForegroundFCM = () => {
  onMessage(messaging, (payload) => {
    console.log("📩 Foreground FCM:", payload);

    if (Notification.permission === "granted") {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo.png",
      });
    }
  });
};
