const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use process.cwd() to be absolutely certain of the root directory
        const uploadsDir = path.join(process.cwd(), 'uploads');
        try {
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            cb(null, uploadsDir);
        } catch (err) {
            console.error('CRITICAL: FAILED TO CREATE UPLOADS DIR', err);
            cb(err);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '') || '.dat';
        cb(null, `file-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;
