import express from 'express';
import * as controller from '../controllers/notifications.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Any logged-in user can read notifications.
router.get('/', authenticate, controller.list);
router.get('/:id', authenticate, controller.get);

// Delete notification (admin only): authorize blocks normal users.
router.delete('/:id', authenticate, authorize(['admin']), controller.remove);

export default router;
