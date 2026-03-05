const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    registerNumber: {
        type: String,
        required: true,
        unique: true,
    },
    academicYear: {
        type: String,
        required: true,
    },
    semester: {
        type: Number,
        required: true,
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    attendance: [{
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        percentage: { type: Number, default: 0 },
        totalClasses: { type: Number, default: 0 },
        attendedClasses: { type: Number, default: 0 },
    }],
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
