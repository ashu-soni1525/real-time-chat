import 'dotenv/config'
import express from 'express'
import cors from 'cors'
// import morgan from 'morgan'
// import path from 'path'
import http from 'http'
 import { connectDB } from './lib/db.js'
import userRouter from "./routes/user.route.js"
import messageRouter from './routes/message.route.js'


const app = express()
const server = http.createServer(app)
app.use(express.json({limit:"4mb"}))
app.use(cors());

app.use('/api/status', (req, res) => {
  res.send(`API is Running on Port ${process.env.PORT}`)
})

app.use('/api/auth', userRouter)
app.use('/api/messages', messageRouter)

await connectDB();
const PORT = process.env.PORT ||5000;
server.listen(PORT, () => {
  console.log('Server is running at PORT', PORT)
})


