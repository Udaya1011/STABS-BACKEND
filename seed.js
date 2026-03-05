const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        const adminExists = await User.findOne({ email: 'admin@educonnect.com' });

        if (adminExists) {
            console.log('Admin user already exists.');
            process.exit();
        }

        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@educonnect.com',
            password: 'adminpassword123',
            role: 'admin',
        });

        console.log('Admin user created successfully!');
        console.log('Email: admin@educonnect.com');
        console.log('Password: adminpassword123');

        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
