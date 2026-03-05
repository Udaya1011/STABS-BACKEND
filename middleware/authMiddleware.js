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
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                res.status(401);
                return next(new Error('Not authorized, user not found'));
            }
            return next();
        } catch (error) {
            console.error('Auth Middleware Error:', error.message);
            res.status(401);
            return next(new Error('Not authorized, token failed'));
        }
    }

    if (!token) {
        console.warn('Auth missing for:', req.method, req.originalUrl);
        console.warn('Headers:', JSON.stringify(req.headers, null, 2));
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        next(new Error('Not authorized as an admin'));
    }
};

const teacher = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(401);
        next(new Error('Not authorized as a teacher'));
    }
};

const student = (req, res, next) => {
    if (req.user && (req.user.role === 'student' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(401);
        next(new Error('Not authorized as a student'));
    }
};

module.exports = { protect, admin, teacher, student };
