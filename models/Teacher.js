const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    designation: String,
    qualifications: String,
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    availability: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        slots: [{
            start: String, // format HH:mm
            end: String,
            isBooked: { type: Boolean, default: false },
        }],
    }],
    officeHours: String,
    maxAppointmentsPerDay: {
        type: Number,
        default: 10,
    },
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
