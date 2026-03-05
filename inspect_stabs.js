require('dotenv').config();
const mongoose = require('mongoose');
const STABS_URI = process.env.MONGO_URI.replace('STUDENT_TEACHER-PORTAL', 'STABS');

const inspectStabs = async () => {
    try {
        await mongoose.connect(STABS_URI);
        const users = await mongoose.connection.db.collection('users').find({}).limit(2).toArray();
        console.log('--- Sample Users in STABS ---');
        console.log(JSON.stringify(users, null, 2));
        await mongoose.connection.close();
    } catch (e) { console.error(e); }
};
inspectStabs();
