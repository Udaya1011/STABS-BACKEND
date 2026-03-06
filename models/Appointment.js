const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'rescheduled', 'completed', 'available', 'cancelled'],
        default: 'pending',
    },
    meetingLink: String,
    teacherNote: String,
    cancelReason: String,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'low',
        required: false,
    },
    appointmentType: {
        type: String,
        enum: ['slot', 'appointment'],
        default: 'appointment',
    },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
