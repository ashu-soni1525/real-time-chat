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


// const subscribeToMessages = async () => {
//   if (!socket) return;

//   socket.on("newMessage", (newMessage) => {
//     if (selectedUser && newMessage.senderId === selectedUser._id) {
//       newMessage.seen = true;

//       setMessages((prevMessages) => [...prevMessages, newMessage]);

//       axios.put(`/api/messages/mark/${newMessage._id}`);
//     } else {
//       setUnseenMessages((prevUnseenMessages) => ({
//         ...prevUnseenMessages,
//         [newMessage.senderId]:
//           prevUnseenMessages[newMessage.senderId]
//             ? prevUnseenMessages[newMessage.senderId] + 1
//             : 1,
//       }));
//     }
//   });
// };

// const unSubscribeFromMessages =  () => {
// if(socket) (socket).off("newMessage");
// }

// useEffect(() => {
// subscribeToMessages();
// return () => unSubscribeFromMessages();
// },[socket,selectedUser])


  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const senderId = newMessage.senderId?.toString();

      if (
        selectedUser &&
        senderId === selectedUser._id.toString()
      ) {
        // message belongs to currently open chat
        setMessages((prev) => [...prev, newMessage]);

        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        // message from another user → unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
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