require('dotenv').config();
const mongoose = require('mongoose');

const dropDuplicateIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Dropping conflicting unique indexes...');

        try {
            await mongoose.connection.db.collection('teachers').dropIndex('teacherId_1');
            console.log('Dropped teacherId_1 from teachers');
        } catch (e) { console.log('teacherId_1 index not found or already dropped'); }

        try {
            await mongoose.connection.db.collection('teachers').dropIndex('email_1');
            console.log('Dropped email_1 from teachers');
        } catch (e) { console.log('email_1 index not found or already dropped'); }

        try {
            await mongoose.connection.db.collection('students').dropIndex('studentId_1');
            console.log('Dropped studentId_1 from students');
        } catch (e) { console.log('studentId_1 index not found or already dropped'); }

        console.log('Index cleanup complete.');
        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};
dropDuplicateIndexes();
