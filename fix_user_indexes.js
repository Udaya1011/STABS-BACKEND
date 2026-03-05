require('dotenv').config();
const mongoose = require('mongoose');

const fixUserIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Checking and fixing User indexes...');

        const userCollection = mongoose.connection.db.collection('users');

        try {
            await userCollection.dropIndex('username_1');
            console.log('Dropped non-sparse username_1 index from users');
        } catch (e) {
            console.log('username_1 index not found or already dropped');
        }

        console.log('Index fix complete.');
        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};
fixUserIndexes();
