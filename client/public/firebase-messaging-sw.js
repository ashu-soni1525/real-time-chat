/* global self */

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDtbdVlnMMgGviFiPcr_5FHvk0dZPyXfGA",
  authDomain: "real-time-chat-ca4b6.firebaseapp.com",
  projectId: "real-time-chat-ca4b6",
  messagingSenderId: "269407712239",
  appId: "1:269407712239:web:cb341a20cb1f4e03557c1a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("🟣 BACKGROUND FCM RECEIVED", payload);

  self.registration.showNotification(
    payload.notification?.title || "New Message",
    {
      body: payload.notification?.body || "You received a message",
      icon: "/logo.png",
    }
  );
});

