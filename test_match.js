const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testBcrypt = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@educonnect.com' });
        if (user) {
            const isMatch = await bcrypt.compare('adminpassword123', user.password);
            process.stdout.write(`MATCH: ${isMatch}\n`);
        } else {
            process.stdout.write("USER NOT FOUND\n");
        }
        process.exit(0);
    } catch (err) {
        process.stdout.write(`ERROR: ${err.message}\n`);
        process.exit(1);
    }
};

testBcrypt();
