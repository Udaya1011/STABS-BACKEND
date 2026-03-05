const express = require('express');
const { getMessages, sendMessage, getUnreadCounts, markMessagesAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, sendMessage);

router.route('/unread/counts')
    .get(protect, getUnreadCounts);

router.route('/:userId')
    .get(protect, getMessages);

router.route('/:userId/read')
    .post(protect, markMessagesAsRead);

module.exports = router;
