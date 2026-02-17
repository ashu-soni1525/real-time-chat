// import React , { useContext , useEffect}  from 'react' 
// import HomePage from './pages/HomePages'
// import LoginPage from './pages/LoginPage'
// import ProfilePage from './pages/ProfilePage'
// import { Navigate, Route, Routes } from 'react-router-dom'
// import { Toaster } from 'react-hot-toast'
// import toast from "react-hot-toast";
// import { AuthContext } from '../context/AuthContex'
// import { db, messaging } from "./firebase/firebase.js";
// import { onMessage } from "firebase/messaging";
// const  App =()=> {
//   const { authUser , loading } = useContext(AuthContext);
//  console.log("authuser", authUser);
//    console.log("🔥 Firestore DB:", db); // TEMP CHECK

//   console.log("🔥 Firestore DB:", db); // TEMP CHECK
//     useEffect(() => {
//     if (!authUser) return; // only listen if user is logged in

//     const unsubscribe = onMessage(messaging, (payload) => {
//       console.log("Foreground message:", payload);
//       toast.success(payload.notification?.body || "New message received!");
//     });

//     return () => {
//       unsubscribe(); // clean up on unmount or logout
//     };
//   }, [authUser]);

//   if (loading) {
//     return (
//       <div className="h-screen flex items-center justify-center text-white">
//         Loading...
//       </div>
//     );
//   }
//   return (
// <div className="bg-[url('/bgImage.svg')] bg-no-repeat bg-cover bg-center min-h-screen">
//       <Toaster />
//    <Routes>
//     <Route path='/' element={authUser ? <HomePage /> : <Navigate to={"/login"} />}/>
//     <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/"/>}/>
//     <Route path='/profile' element={authUser ? <ProfilePage/> : <Navigate to={"/login"}/>}/>
//    </Routes>
//     </div>
//   )
// }

// export default App
import React, { useContext, useEffect } from "react";
import HomePage from "./pages/HomePages";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContex";
import { db, messaging } from "./firebase/firebase.js";
import { onMessage } from "firebase/messaging";
import { registerForPushNotifications } from "./firebase/notification.js";

const App = () => {
  const { authUser, loading } = useContext(AuthContext);

  console.log("authUser:", authUser);
  console.log("Firestore DB:", db);

  // ✅ 1️⃣ Register Service Worker
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("✅ SW registered:", registration.scope);
      })
      .catch((err) => {
        console.error("❌ SW registration failed:", err);
      });
  }
}, []);


  // ✅ 2️⃣ Register FCM token after login
  useEffect(() => {
    if (authUser) {
      registerForPushNotifications();
    }
  }, [authUser]);

  // ✅ 3️⃣ Listen for foreground messages
  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📨 Foreground message:", payload);
      toast.success(payload.notification?.body || "New message received!");
    });

    return () => unsubscribe();
  }, [authUser]);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-[url('/bgImage.svg')] bg-no-repeat bg-cover bg-center min-h-screen">
      <Toaster />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
};

export default App;
