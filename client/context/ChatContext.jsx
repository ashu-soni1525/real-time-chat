import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContex";
import axios from "axios";

export const ChatContext = createContext();

export const ChatProvider = ({children}) => {
  const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const[selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const { socket } = useContext(AuthContext);
  const [chatTheme, setChatTheme] = useState("whatsapp");


    const getUsers = async () => {
      try {
        const {data} = await axios.get('/api/messages/users');
        if (data.success) {
          setUsers(data.users);
          setUnseenMessages(data.unseenMessages)
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error(error.messages);
      }
    }

const getMessages = async (userId) => {
    try {
        const { data } = await axios.get(`/api/messages/${userId}`);
        if (data.success) {
          setMessages(data.messages);
        }
    } catch (error) {
            toast.error(error.messages);
    }
}

// const sendMessages = async (messagesData) => {
//     try {
//         const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`,messagesData);

//         if (data.success) {
//           setMessages((prevMessages) => [...prevMessages, data.newMessage]);
//         }else{
//             toast.error(data.message);
//         }
//     } catch (error) {
//             toast.error(error.messages);
//     }
// }

const sendMessages = async (messagesData) => {
  if (!selectedUser?._id) {
    toast.error("No user selected");
    return;
  }

  try {
    const { data } = await axios.post(
      `/api/messages/send/${selectedUser._id}`,
      messagesData
    );

    if (data.success) {
      setMessages((prev) => [...prev, data.newMessage]);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Message failed");
  }
};

  useEffect(() => {
    if (!socket) return;
const handleNewMessage = (newMessage) => {
  const senderId = newMessage.senderId?.toString();

  const isSameChat =
    selectedUser &&
    senderId === selectedUser._id.toString();

  if (isSameChat) {
    setMessages((prev) => [...prev, newMessage]);
    axios.put(`/api/messages/mark/${newMessage._id}`);
    return;
  }

  // 🔔 TAB SWITCH NOTIFICATION
  if (document.visibilityState === "hidden") {
    new Notification("New Message", {
      body: newMessage.text || "You received a message",
      icon: "/logo.png",
    });
  }

  setUnseenMessages((prev) => ({
    ...prev,
    [senderId]: (prev[senderId] || 0) + 1,
  }));
};

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedUser]);


const value = {
messages,
users,
selectedUser,
getUsers,
setMessages,
setSelectedUser,
unseenMessages,
setUnseenMessages,
getMessages,
sendMessages,
 chatTheme,
        setChatTheme,
    }
    return(
<ChatContext.Provider value={value}>
    {children}
    </ChatContext.Provider>
    )
}