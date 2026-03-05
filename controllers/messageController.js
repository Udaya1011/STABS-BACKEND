const Message = require('../models/Message');

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
    const { userId } = req.params;

    // Mark received messages as read with timestamp
    await Message.updateMany(
        { sender: userId, receiver: req.user._id, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );

    const io = req.app.get('socketio');
    if (io) {
        io.to(userId).emit('messagesRead', { readerId: req.user._id, readAt: new Date() });
    }

    const messages = await Message.find({
        $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id },
        ],
    }).sort({ createdAt: 1 });

    res.json(messages);
};

// @desc    Get counts of unread messages for the logged-in user grouped by sender
// @route   GET /api/messages/unread/counts
// @access  Private
const getUnreadCounts = async (req, res) => {
    try {
        const unreadCounts = await Message.aggregate([
            { $match: { receiver: req.user._id, isRead: false } },
            { $group: { _id: '$sender', count: { $sum: 1 } } }
        ]);

        // Get last message for each unique contact (both sent and received) to sort sidebar
        const lastMessages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: req.user._id },
                        { receiver: req.user._id }
                    ]
                }
            },
            {
                $project: {
                    contact: {
                        $cond: {
                            if: { $eq: ['$sender', req.user._id] },
                            then: '$receiver',
                            else: '$sender'
                        }
                    },
                    createdAt: 1
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$contact',
                    lastMessageTime: { $first: '$createdAt' }
                }
            }
        ]);

        const contactsData = {};
        lastMessages.forEach(m => {
            contactsData[m._id] = { lastMessageTime: m.lastMessageTime, count: 0 };
        });

        unreadCounts.forEach(c => {
            if (contactsData[c._id]) {
                contactsData[c._id].count = c.count;
            } else {
                contactsData[c._id] = { count: c.count };
            }
        });

        res.json(contactsData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    const { receiver, content, messageType, fileUrl, appointmentId } = req.body;

    const message = await Message.create({
        sender: req.user._id,
        receiver,
        content,
        messageType: messageType || 'text',
        fileUrl,
        appointmentId,
    });

    if (message) {
        const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar');

        const io = req.app.get('socketio');
        if (io) {
            io.to(receiver).emit('newMessage', populatedMessage);
            // Also notify unread count change
            const unreadCount = await Message.countDocuments({ receiver, isRead: false, sender: req.user._id });
            io.to(receiver).emit('unreadUpdate', { sender: req.user._id, count: unreadCount });
        }

        res.status(201).json(message);
    } else {
        res.status(400);
        throw new Error('Invalid message data');
    }
};

const markMessagesAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        const readAt = new Date();

        await Message.updateMany(
            { sender: userId, receiver: req.user._id, isRead: false },
            { $set: { isRead: true, readAt } }
        );

        const io = req.app.get('socketio');
        if (io) {
            io.to(userId).emit('messagesRead', { readerId: req.user._id, readAt });
        }

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMessages,
    sendMessage,
    getUnreadCounts,
    markMessagesAsRead,
};
