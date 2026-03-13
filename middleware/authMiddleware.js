const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.toLowerCase().startsWith('bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Verifying Token:', token.substring(0, 10) + '...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded Token:', decoded);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                console.log('User not found in DB for ID:', decoded.id);
                res.status(401);
                return next(new Error('Not authorized, user not found'));
            }
            console.log('Authenticated User:', req.user.email, 'Role:', req.user.role);
            return next();
        } catch (error) {
            console.error('Auth Middleware Error (Token Verification):', error.message);
            res.status(401);
            return next(new Error('Not authorized, token failed: ' + error.message));
        }
    }

    if (!token) {
        console.warn('Auth missing for:', req.method, req.originalUrl);
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        console.warn('Admin Access Denied for:', req.user?.email, 'Role:', req.user?.role);
        res.status(403);
        next(new Error('Not authorized as an admin'));
    }
};

const teacher = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403);
        next(new Error('Not authorized as a teacher'));
    }
};

const student = (req, res, next) => {
    if (req.user && (req.user.role === 'student' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403);
        next(new Error('Not authorized as a student'));
    }
};

const staff = (req, res, next) => {
    if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403);
        next(new Error('Not authorized as staff'));
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            return next(new Error(`Role ${req.user.role} is not authorized to access this route`));
        }
        next();
    };
};

module.exports = { protect, admin, teacher, student, staff, authorize };
