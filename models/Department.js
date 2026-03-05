const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    blocks: [String],
    classrooms: [String],
    description: String,
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
