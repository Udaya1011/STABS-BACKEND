const Notification = require('../models/Notification');

// @desc    Get all user notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 });
    res.json(notifications);
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Notification marked as read' });
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
};
