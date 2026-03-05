const express = require('express');
const { uploadVideo, getVideos, updateVideo, deleteVideo, streamVideo } = require('../controllers/videoController');
const { protect, teacher } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Route for getting all videos and uploading a new one
router.route('/')
    .get(protect, getVideos)
    .post(protect, teacher, upload.single('video'), uploadVideo);

// Public route for streaming
router.get('/stream/:fileId', streamVideo);

// Delete route
router.route('/:id')
    .put(protect, teacher, updateVideo)
    .delete(protect, teacher, deleteVideo);

module.exports = router;
