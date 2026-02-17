import 'dotenv/config'
import express from 'express'
import cors from 'cors'
// import morgan from 'morgan'
// import path from 'path'
import http from 'http'
 import { connectDB } from './lib/db.js'
import userRouter from "./routes/user.route.js"
import messageRouter from './routes/message.route.js'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
await connectDB();

export const io = new Server(server,{
  cors: {origin:'*'}
})

// export const userSocketMap = {};

// io.on('connection',(socket)=>{
//   const userId =socket.handshake.query.userId;
//   console.log("User Connected", userId)
//   if(userId) userSocketMap[userId]= socket.id;

//   io.emit('getOnlineUsers',Object.keys(userSocketMap))

//   socket.on("disconnect",()=>{
//       console.log("User disconnect", userId)
//       delete userSocketMap[userId];
//       io.emit("getOnlineUsers", Object.keys(userSocketMap))

//   })
// })

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (!userId) {
    console.log("❌ Socket connected without userId");
    return;
  }

  const userIdStr = userId.toString();
  console.log("✅ User Connected:", userIdStr);

  // 🔑 Always store as STRING
  userSocketMap[userIdStr] = socket.id;

  // 🔄 Send online users to everyone
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    delete userSocketMap[userIdStr];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.use(express.json({limit:"4mb"}))
app.use(cors());


app.use('/api/auth', userRouter)
app.use('/api/messages', messageRouter)

const PORT = process.env.PORT ||5000;
server.listen(PORT, () => {
  console.log('Server is running at PORT', PORT)
})


