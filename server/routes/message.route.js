import express from 'express'
import { checkAuth, protectRoute } from '../middleware/auth.js';
import { getMessages, getUsersFromSidebar, markMessageAsSeen, sendMessage } from '../controller/message.controller.js';
const messageRouter = express.Router();

messageRouter.get('/users', protectRoute,getUsersFromSidebar);
messageRouter.get('/:id',protectRoute ,getMessages);
messageRouter.get('/mark/:id',protectRoute ,markMessageAsSeen);
messageRouter.post('/send/:id',protectRoute, sendMessage );


export default messageRouter;