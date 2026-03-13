const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { getGridfsBucket } = require('../config/db');

// @route   POST /api/upload
// @desc    Upload file to MongoDB GridFS
router.post('/', protect, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('MULTER ERROR:', err);
            return res.status(400).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            console.error('UPLOAD ERROR:', err);
            return res.status(400).json({ message: err.message || 'File upload failed' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // For GridFS, we point to our local retrieve route
        const url = `/api/upload/file/${req.file.filename}`;

        res.json({
            message: 'File stored in database successfully',
            url: url,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    });
});

// @route   GET /api/upload/file/:filename
// @desc    Retrieve file from MongoDB GridFS
router.get('/file/:filename', async (req, res) => {
    try {
        const bucket = getGridfsBucket();
        if (!bucket) {
            return res.status(500).json({ message: 'GridFS not initialized' });
        }

        const files = await bucket.find({ filename: req.params.filename }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Set proper content type for the browser
        res.set('Content-Type', files[0].contentType || 'application/octet-stream');
        
        // Stream the file back to the client
        const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
        downloadStream.pipe(res);

        downloadStream.on('error', (error) => {
            console.error('STREAM ERROR:', error);
            res.status(500).send('Error streaming file');
        });
    } catch (error) {
        console.error('RETRIEVAL ERROR:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
