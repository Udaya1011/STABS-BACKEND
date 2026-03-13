const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { getGridfsBucket } = require('../config/db');

// @route   POST /api/upload
// @desc    Upload file to MongoDB GridFS
const fs = require('fs');
const path = require('path');

// @route   POST /api/upload
// @desc    Upload file and sync to MongoDB GridFS
router.post('/', protect, (req, res) => {
    console.log('--- UPLOAD REQUEST HEADERS ---', req.headers['content-type']);
    upload.single('file')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('--- MULTER ERROR ---');
            return res.status(400).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            console.error('--- UPLOAD ERROR ---', err);
            return res.status(400).json({ message: err.message || 'File upload failed' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file found in request' });
        }

        try {
            const mongoose = require('mongoose');
            console.log('--- DB CONNECTION STATE:', mongoose.connection.readyState);
            const bucket = getGridfsBucket();
            
            // Only sync to GridFS if DB is connected
            if (bucket && mongoose.connection.readyState === 1) {
                console.log('--- SYNCING TO GRIDFS ---', req.file.filename);
                const readStream = fs.createReadStream(req.file.path);
                const uploadStream = bucket.openUploadStream(req.file.filename, {
                    contentType: req.file.mimetype
                });

                readStream.pipe(uploadStream);

                uploadStream.on('finish', () => {
                    console.log('--- GRIDFS SYNC COMPLETE ---');
                });

                uploadStream.on('error', (err) => {
                    console.error('--- GRIDFS SYNC ERROR ---', err);
                });
            } else {
                console.warn('--- DB NOT CONNECTED: SKIPPING GRIDFS SYNC ---');
            }

            // Always return the local path as a reliable fallback
            const url = `/uploads/${req.file.filename}`;

            res.json({
                message: mongoose.connection.readyState === 1 ? 'File uploaded successfully' : 'File uploaded locally (DB sync pending)',
                url: url,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
        } catch (error) {
            console.error('GRIDFS CONFIG ERROR:', error);
            // Even if GridFS fails, we have the local file
            res.json({
                message: 'File uploaded locally (GridFS sync failed)',
                url: `/uploads/${req.file.filename}`,
                filename: req.file.filename
            });
        }
    });
});

// @route   GET /api/upload/file/:filename
// @desc    Retrieve file from MongoDB GridFS
router.get('/file/:filename', async (req, res) => {
    try {
        const bucket = getGridfsBucket();
        if (!bucket) {
            return res.status(500).json({ message: 'Storage not initialized' });
        }

        const filename = req.params.filename;
        const files = await bucket.find({ filename }).toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.set('Content-Type', files[0].contentType || 'application/octet-stream');
        const downloadStream = bucket.openDownloadStreamByName(filename);
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
