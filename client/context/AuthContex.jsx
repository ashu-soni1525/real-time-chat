import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast"; // ✅ FIXED
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { registerForPushNotifications } from "../src/firebase/notification";
import { initForegroundFCM } from "../src/firebase/onMessageListener";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ ADD
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!socket) return;

    const handleVisibilityChange = () => {
      socket.emit("tab-visibility", {
        isVisible: document.visibilityState === "visible",
      });
    };

    // initial state
    handleVisibilityChange();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket]);
  useEffect(() => {
    initForegroundFCM();
  }, []);

  // ✅ CHECK AUTH
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");

      if (data.success) {
        setAuthUser(data.user);
      } else {
        setAuthUser(null);
      }
    } catch (err) {
      setAuthUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (state, credentials) => {
    try {
      // ❌ GET ❌ → ✅ POST
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      console.log("data", data);
      if (data.success) {
        setAuthUser(data.data);
        setToken(data.token);

        // axios.defaults.headers.common["token"] = data.token;
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        toast.success(data.message);
        navigate("/");

        setLoading(false); // ✅ ADD
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // const logout = () => {
  //   // 1️⃣ Disconnect socket FIRST
  //   socket?.disconnect();
  //   setSocket(null); // 🔥 MOST IMPORTANT

  //   // 2️⃣ Clear auth data
  //   localStorage.removeItem("token");
  //   setToken(null);
  //   setAuthUser(null);
  //   setOnlineUsers([]);

  //   // 3️⃣ Remove axios auth header
  //   delete axios.defaults.headers.common["Authorization"];

  //   toast.success("Logged out successfully");
  // };

  const logout = async () => {
    try {
      await axios.post("/api/auth/remove-fcm-token");
    } catch (err) {}

    socket?.disconnect();
    setSocket(null);

    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);

    delete axios.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully");
  };

  // ✅ UPDATE PROFILE
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-Profile", body);

      if (data.success) {
        setAuthUser(data.User);
        toast.success("Profile updated successfully"); // ✅ FIXED
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (!authUser) {
      // logout case
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    const userId = authUser._id || authUser.id;

    // 🔥 create fresh socket when authUser exists
    const newSocket = io(backendUrl, {
      query: { userId },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("🟢 Online users:", userIds);
      setOnlineUsers(userIds);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      registerForPushNotifications();
    }
  }, [authUser]);

  // ✅ INIT
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        loading,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
