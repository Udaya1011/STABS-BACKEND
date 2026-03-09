const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'file', 'voice', 'audio', 'call'],
        default: 'text',
    },
    fileUrl: String,
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
