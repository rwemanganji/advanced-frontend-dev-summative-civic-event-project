import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as Controller from '../controllers/eventFeedback.controller.js';

const router = express.Router();

// Any logged-in user can leave and edit their own feedback.
router.post('/', authenticate, Controller.createFeedback);
router.put('/:id', authenticate, Controller.updateFeedback);
router.get('/my-feedback', authenticate, Controller.getUserFeedback);

// Admin only: see all feedback for an event.
router.get('/event/:event_id', authenticate, authorize(['admin']), Controller.getEventFeedback);

export default router;
