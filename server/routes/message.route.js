import express from 'express'
import { checkAuth, protectRoute } from '../middleware/auth.js';
import { getMessages, getUsersFromSidebar, markMessageAsSeen } from '../controller/message.controller.js';
const messageRouter = express.Router();

messageRouter.get('/users', protectRoute,getUsersFromSidebar);
messageRouter.get('/:id',protectRoute ,getMessages);
messageRouter.get('/mark/:id',protectRoute ,markMessageAsSeen);


export default messageRouter;