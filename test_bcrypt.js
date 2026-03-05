const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testBcrypt = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@educonnect.com' });
        if (user) {
            const password = 'adminpassword123';
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Password test for adminpassword123:', isMatch);

            // Log the hash to see if it looks right
            console.log('Hash in DB:', user.password);
        } else {
            console.log('Admin not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testBcrypt();
