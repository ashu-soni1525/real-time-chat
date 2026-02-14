import express from 'express'
import { login, signup, updateProfile } from '../controller/User.controller.js';
import { checkAuth, protectRoute } from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.put('/update-Profile',protectRoute, updateProfile);
userRouter.get('/check',protectRoute, checkAuth)


export default userRouter;

 