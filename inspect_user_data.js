require('dotenv').config();
const mongoose = require('mongoose');

const inspectUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await mongoose.connection.db.collection('users').findOne({});
        console.log('--- USER DATA ---');
        console.log(user);
        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
};
inspectUser();
