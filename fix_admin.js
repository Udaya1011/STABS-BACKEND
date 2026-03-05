const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@educonnect.com' });
        if (user) {
            user.username = 'admin';
            user.password = 'adminpassword123';
            await user.save();
            console.log('Admin updated: email=admin@educonnect.com, username=admin, password=adminpassword123');
        } else {
            console.log('Admin user not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateAdmin();
