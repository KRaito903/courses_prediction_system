// src/routes/profile.routes.js
import { Router } from 'express';
import { getFullProfile, updateUserProfile } from '../controllers/profile.controller.js';
import checkAuth from '../middlewares/checkAuth.js';

const profileRouter = Router();

// Lấy profile đầy đủ (users + students)
profileRouter.get('/me', checkAuth, getFullProfile);

// Cập nhật profile
profileRouter.put('/me', checkAuth, updateUserProfile);

export default profileRouter;
