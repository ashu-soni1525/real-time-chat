import express from 'express'
import { login, signup, updateProfile,removeFcmToken, saveFcmToken,sendNotification } from '../controller/User.controller.js';
import { checkAuth, protectRoute } from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.put('/update-Profile',protectRoute, updateProfile);
userRouter.get('/check',protectRoute, checkAuth)

userRouter.post("/save-fcm-token", protectRoute, saveFcmToken);
userRouter.post("/remove-fcm-token", protectRoute, removeFcmToken);
userRouter.post("/send-notification", protectRoute, sendNotification);

export default userRouter;

 