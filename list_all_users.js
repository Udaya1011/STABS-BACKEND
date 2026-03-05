require('dotenv').config();
const mongoose = require('mongoose');

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('--- USERS ---');
        users.forEach(u => console.log(`Email: ${u.email}, Role: ${u.role}`));
        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};
listUsers();
