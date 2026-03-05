const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: /admin@educonnect/ });
        if (user) {
            console.log('User JSON:', JSON.stringify({
                email: user.email,
                role: user.role,
                username: user.username,
                hasPassword: !!user.password
            }, null, 2));
        } else {
            console.log('Searching for any user...');
            const firstUser = await User.findOne({});
            console.log('First user found:', JSON.stringify(firstUser, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
