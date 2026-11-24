import express from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/events.controller.js';
import validateBody from '../middlewares/validateBody.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { uploadEventImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

// All logged-in users (admins and normal users) can view events.
router.get('/', authenticate, controller.list);
router.get('/:id', authenticate, controller.get);

// Admin-only routes (now supports image upload)
// authorize(['admin']) blocks normal users with a 403.
router.post(
    '/',
    authenticate,
    authorize(['admin']),
    uploadEventImage.single('image'),
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('location').notEmpty().withMessage('Location is required'),
        body('starts_at').notEmpty().withMessage('Start date/time is required'),
        body('ends_at').notEmpty().withMessage('End date/time is required'),
    ],
    validateBody,
    controller.create
);

router.put(
    '/:id',
    authenticate,
    authorize(['admin']),
    uploadEventImage.single('image'),
    controller.update
);

// Only admins can delete events.
router.delete('/:id', authenticate, authorize(['admin']), controller.remove);

export default router;
