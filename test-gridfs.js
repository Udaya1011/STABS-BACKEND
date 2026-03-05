require('dotenv').config();
const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');

async function testGridFS() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const storage = new GridFsStorage({
            url: process.env.MONGO_URI,
            file: (req, file) => {
                return {
                    filename: 'test-' + Date.now(),
                    bucketName: 'videos'
                };
            }
        });

        storage.on('connection', () => {
            console.log('GridFS Storage Connected');
            process.exit(0);
        });

        storage.on('connectionFailed', (err) => {
            console.error('GridFS Connection Failed:', err);
            process.exit(1);
        });

        // Timeout
        setTimeout(() => {
            console.log('GridFS Connection Timeout');
            process.exit(1);
        }, 10000);

    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testGridFS();
