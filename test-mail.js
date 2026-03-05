const nodemailer = require('nodemailer');
require('dotenv').config();

async function testConnection() {
    console.log('Testing with:', process.env.EMAIL_USER);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('Server is ready to take our messages');
    } catch (error) {
        console.log('Verification failed:', error.message);
    }
}

testConnection();
