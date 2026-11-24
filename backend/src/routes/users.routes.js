import express from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/users.controller.js';
import validateBody from '../middlewares/validateBody.middleware.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// -----------------------------
// Admin-only routes
// -----------------------------
// authorize(['admin']) blocks normal users with a 403 before the controller runs.

// List all users (paginated)
router.get('/', authenticate, authorize(['admin']), controller.list);

// Get single user by ID
router.get('/:id', authenticate, authorize(['admin']), controller.get);

// Enable user
router.patch('/:id/enable', authenticate, authorize(['admin']), controller.enable);

// Disable user
router.patch('/:id/disable', authenticate, authorize(['admin']), controller.disable);


// -----------------------------
// User self-management
// -----------------------------
// Any logged-in user (no role check). They can only see and edit their own account.

// Get own profile
router.get('/profile/me', authenticate, controller.getSelf);

// Update own profile (cannot update role)
router.patch(
    '/profile/me',
    authenticate,
    [
        body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
        body('email').optional().isEmail().withMessage('Must be a valid email'),
        // Stops a normal user from making themselves an admin.
        body('role').not().exists().withMessage('Cannot update role'),
        body('is_active').not().exists().withMessage('Cannot update status'),
    ],
    validateBody,
    controller.updateSelf
);

export default router;
