require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('./models/Video');
const User = require('./models/User');
const Subject = require('./models/Subject');

const seedVideos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Find a teacher and subjects to associate with
        const teacher = await User.findOne({ role: { $in: ['teacher', 'admin'] } });
        const subjects = await Subject.find({}).limit(3);

        if (!teacher || subjects.length === 0) {
            console.error('Error: Please make sure you have at least one teacher and one subject in the database.');
            process.exit(1);
        }

        console.log(`Seeding videos for teacher: ${teacher.name}`);

        const videoData = [
            {
                title: 'Introduction to Web Development',
                description: 'A comprehensive guide for beginners starting their journey in coding.',
                subject: subjects[0]._id,
                teacher: teacher._id,
                category: 'Lecture',
                url: 'https://res.cloudinary.com/demo/video/upload/v1631526543/sample_video.mp4', // Fallback sample
                fileId: new mongoose.Types.ObjectId() // Placeholder ID
            },
            {
                title: 'Advanced React Hooks',
                description: 'Deep dive into useMemo, useCallback, and custom hooks for performance.',
                subject: subjects[1 % subjects.length]._id,
                teacher: teacher._id,
                category: 'Tutorial',
                url: 'https://res.cloudinary.com/demo/video/upload/v1631526543/sample_video.mp4',
                fileId: new mongoose.Types.ObjectId()
            },
            {
                title: 'Data Structures and Algorithms',
                description: 'Understanding Big O notation and common sorting algorithms.',
                subject: subjects[2 % subjects.length]._id,
                teacher: teacher._id,
                category: 'Lecture',
                url: 'https://res.cloudinary.com/demo/video/upload/v1631526543/sample_video.mp4',
                fileId: new mongoose.Types.ObjectId()
            },
            {
                title: 'Machine Learning Basics',
                description: 'An overview of supervised and unsupervised learning techniques.',
                subject: subjects[0]._id,
                teacher: teacher._id,
                category: 'Seminar',
                url: 'https://res.cloudinary.com/demo/video/upload/v1631526543/sample_video.mp4',
                fileId: new mongoose.Types.ObjectId()
            },
            {
                title: 'Cloud Computing Fundamentals',
                description: 'Exploring AWS, Azure, and Google Cloud infrastructure patterns.',
                subject: subjects[1 % subjects.length]._id,
                teacher: teacher._id,
                category: 'Lab',
                url: 'https://res.cloudinary.com/demo/video/upload/v1631526543/sample_video.mp4',
                fileId: new mongoose.Types.ObjectId()
            }
        ];

        await Video.deleteMany({}); // Clear existing records for a fresh start
        await Video.insertMany(videoData);

        console.log('Successfully seeded 5 sample video records!');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedVideos();
