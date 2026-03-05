require('dotenv').config();
const mongoose = require('mongoose');

// Adjust URI to point to STABS database
const STABS_URI = process.env.MONGO_URI.replace('STUDENT_TEACHER-PORTAL', 'STABS');

const checkStabsData = async () => {
    try {
        await mongoose.connect(STABS_URI);
        console.log(`Connected to STABS database`);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('--- Collections in STABS ---');

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error checking STABS data:', error);
        process.exit(1);
    }
};

checkStabsData();
