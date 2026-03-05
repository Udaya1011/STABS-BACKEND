const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const debugAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: 'admin' });
        console.log('Admin count:', users.length);
        users.forEach(u => {
            console.log('Email:', u.email);
            console.log('Email Hex:', Buffer.from(u.email).toString('hex'));
            console.log('Role:', u.role);
            console.log('Username:', u.username);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugAdmin();
