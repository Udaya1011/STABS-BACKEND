const express = require('express');
const { authUser, registerUser, getUserProfile, updateUserProfile, getStaff, saveFaceDescriptor, loginWithFace } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/login-face', loginWithFace);

router.post('/profile/face', protect, saveFaceDescriptor);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.get('/staff', protect, admin, getStaff);

module.exports = router;
