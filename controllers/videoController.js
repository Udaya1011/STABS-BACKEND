const Video = require('../models/Video');
const Subject = require('../models/Subject');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// @desc    Upload a video (Local Disk Method)
// @route   POST /api/videos
const uploadVideo = async (req, res) => {
    try {
        console.log('--- LOCAL UPLOAD STARTED ---');

        if (!req.file) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }

        const { title, description, subject, category, department } = req.body;

        if (!title || !subject) {
            return res.status(400).json({ message: 'Title and Subject are required' });
        }

        // Create the URL path for the frontend
        const videoUrl = `/uploads/${req.file.filename}`;

        const video = await Video.create({
            title,
            description: description || '',
            url: videoUrl,
            subject,
            department: department || null,
            teacher: req.user._id,
            category: category || 'Lecture',
        });

        console.log('--- LOCAL UPLOAD SUCCESS ---', video.url);
        res.status(201).json(video);
    } catch (error) {
        console.error('Upload Controller Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all videos
const getVideos = async (req, res) => {
    try {
        let query = {};
        
        // If student, only show videos for their department/batch or global ones
        if (req.user.role === 'student' && req.user.department) {
            query = {
                $or: [
                    { department: req.user.department },
                    { department: { $exists: false } },
                    { department: null }
                ]
            };
        }

        const videos = await Video.find(query)
            .populate('subject', 'name code')
            .populate('teacher', 'name avatar')
            .populate('department', 'name programme className')
            .sort({ createdAt: -1 });
        res.json(videos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a video (removes local file + DB record)
const deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Authorization check
        if (video.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Delete physical file
        if (video.url && video.url.startsWith('/uploads')) {
            const filePath = path.join(__dirname, '..', video.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Deleted file:', filePath);
            }
        }

        await video.deleteOne();
        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update video metadata
// @route   PUT /api/videos/:id
const updateVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Authorization check
        if (video.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { title, description, subject, category, department } = req.body;

        video.title = title || video.title;
        video.description = description || video.description;
        video.subject = subject || video.subject;
        video.category = category || video.category;
        video.department = department || video.department;

        const updatedVideo = await video.save();
        res.json(updatedVideo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Keeping streamVideo as a placeholder if needed later, but standard static serving is preferred for this method
const streamVideo = (req, res) => {
    res.status(404).json({ message: 'Streaming endpoint disabled in Local Disk mode' });
};

module.exports = {
    uploadVideo,
    getVideos,
    updateVideo,
    deleteVideo,
    streamVideo
};
