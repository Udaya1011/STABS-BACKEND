const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'email role username');
        users.forEach(u => {
            process.stdout.write(`EMAIL: [${u.email}] ROLE: [${u.role}] USERNAME: [${u.username}]\n`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
