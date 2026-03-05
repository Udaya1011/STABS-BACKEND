const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@educonnect.com' });
        if (user) {
            user.password = 'adminpassword123';
            await user.save();
            console.log('Admin password reset to adminpassword123');
        } else {
            console.log('Admin user not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
