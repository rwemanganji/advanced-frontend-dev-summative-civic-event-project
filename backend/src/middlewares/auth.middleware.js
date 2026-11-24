import jwt from 'jsonwebtoken';
import * as Users from '../models/users.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Step 1 of access control: is the user logged in?
// Checks the 'Bearer <token>' header, verifies the token and loads the user.
// The user (including their role) is saved on req.user for the role check.
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ status: 401, message: 'Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await Users.findById(decoded.id);
        if (!user) return res.status(401).json({ status: 401, message: 'User not found' });

        // req.user.role is 'admin' or 'user'. authorize() reads it next.
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ status: 401, message: 'Invalid or expired token' });
    }
};

// Step 2 of access control: does the user have the right role?
// Used after authenticate, e.g. authorize(['admin']) on admin-only routes.
// Admins get through. Normal users are stopped with 403 Forbidden.
export const authorize = (roles = []) => {
    return (req, res, next) => {
        // Role not allowed here (e.g. a normal user on an admin route), so block the request.
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: 403, message: 'Forbidden: insufficient permissions' });
        }
        // Role is allowed, so carry on to the route.
        next();
    };
};
