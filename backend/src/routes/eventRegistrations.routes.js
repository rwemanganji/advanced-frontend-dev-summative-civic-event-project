import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as Controller from '../controllers/eventRegistrations.controller.js';

const router = express.Router();

// Any logged-in user can register, cancel and see their own registrations.
router.post('/register', authenticate, Controller.registerForEvent);
router.post('/cancel', authenticate, Controller.cancelRegistration);
router.get('/my-registrations', authenticate, Controller.getUserRegistrations);

// Admin only: see who registered for an event.
router.get('/event/:event_id/attendees', authenticate, authorize(['admin']), Controller.getEventAttendees);

export default router;
