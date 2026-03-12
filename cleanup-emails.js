const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const lowercaseEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Checking ${users.length} users...`);

        let updatedCount = 0;
        for (const user of users) {
            let needsUpdate = false;
            
            if (user.email && user.email !== user.email.toLowerCase()) {
                user.email = user.email.toLowerCase();
                needsUpdate = true;
            }
            
            if (user.username && user.username !== user.username.toLowerCase()) {
                user.username = user.username.toLowerCase();
                needsUpdate = true;
            }

            if (needsUpdate) {
                await user.save();
                updatedCount++;
                console.log(`Updated user: ${user.email}`);
            }
        }

        console.log(`Successfully updated ${updatedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

lowercaseEmails();
