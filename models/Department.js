const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // removed unique constraint to allow duplicate department names
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    programme: String,
    blocks: [String],
    className: [String],
    classrooms: [String],
    academicYears: [String],
    description: String,
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
