import express from 'express';
import { getAdminDashboard, getUserDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin-only route: authorize(['admin']) sends normal users a 403.
router.get('/admin', authenticate, authorize(['admin']), getAdminDashboard);

// User route (any authenticated user): each user only gets their own stats.
router.get('/me', authenticate, getUserDashboard);

export default router;
