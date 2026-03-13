const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    url: {
        type: String,
        required: true,
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    category: String,
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    },
    thumbnail: String,
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
