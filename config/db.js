const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

let gfs, gridfsBucket;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Initialize GridFS
        gridfsBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
            bucketName: 'uploads'
        });

        gfs = Grid(conn.connection.db, mongoose.mongo);
        gfs.collection('uploads');
        
        console.log('GridFS Initialized');
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const getGfs = () => gfs;
const getGridfsBucket = () => {
    if (gridfsBucket && mongoose.connection.readyState === 1) {
        return gridfsBucket;
    }
    
    // If we have a connection but no bucket (or stale bucket), re-initialize
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });
        return gridfsBucket;
    }
    
    return null;
};

module.exports = { connectDB, getGfs, getGridfsBucket };
