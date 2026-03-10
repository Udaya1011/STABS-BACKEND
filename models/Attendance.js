const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    students: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        status: {
            type: String,
            enum: ['Present', 'Absent'],
            default: 'Absent',
        }
    }],
    date: {
        type: Date,
        default: Date.now,
    },
    slot: {
        type: String,
        // enum: ['9:00 - 10:00', '10:00 - 11:00', ...] or similar
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
