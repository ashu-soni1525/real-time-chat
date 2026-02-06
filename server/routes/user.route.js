import express from 'express'
import { login, signup, upadateProfile } from '../controller/User.controller.js';
import { checkAuth, protectRoute } from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.post('/Sign-up', signup);
userRouter.post('/login', login);
userRouter.put('/upadate-Profile',protectRoute, upadateProfile);
userRouter.get('/check',protectRoute, checkAuth)


export default userRouter;