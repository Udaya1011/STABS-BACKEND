const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    // Check file extension
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|mp4|mov|webm|ogg|mp3|wav/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    // Check mimetype (broad prefix match for media types)
    const mimetype = file.mimetype.startsWith('video/') || 
                    file.mimetype.startsWith('audio/') || 
                    /image|pdf|msword|vnd.openxmlformats-officedocument|vnd.ms-excel|vnd.ms-powerpoint|text|zip|application\/octet-stream/.test(file.mimetype);

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        console.error(`Upload Rejected: ext: ${path.extname(file.originalname)}, mimetype: ${file.mimetype}`);
        cb(new Error('This file type is not allowed! Supported: Images, Voice Notes, PDFs, Docs, Excel, PPT, TXT, Videos, Audio, ZIP.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter,
});

module.exports = upload;
