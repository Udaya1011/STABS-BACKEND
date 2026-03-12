const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Use 'auto' to let Cloudinary determine the type, 
        // but force 'raw' for documents to ensure they aren't rejected
        let resource_type = 'auto';
        const mimetype = file.mimetype;
        
        if (mimetype.includes('pdf') || mimetype.includes('word') || mimetype.includes('officedocument') || mimetype.includes('text')) {
            resource_type = 'raw';
        }

        return {
            folder: 'stabs_uploads',
            resource_type: resource_type,
            allowed_formats: undefined, // undefined allows all formats within the resource_type
            public_id: file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9)
        };
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = upload;
