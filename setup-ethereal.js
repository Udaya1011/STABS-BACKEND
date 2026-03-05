const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function setupEthereal() {
    try {
        console.log('Generating Ethereal credentials...');
        let testAccount = await nodemailer.createTestAccount();

        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        envContent = envContent.replace(/EMAIL_HOST=.*/, `EMAIL_HOST=smtp.ethereal.email`);
        envContent = envContent.replace(/EMAIL_PORT=.*/, `EMAIL_PORT=587`);
        envContent = envContent.replace(/EMAIL_USER=.*/, `EMAIL_USER=${testAccount.user}`);
        envContent = envContent.replace(/EMAIL_PASS=.*/, `EMAIL_PASS=${testAccount.pass}`);

        fs.writeFileSync(envPath, envContent);

        console.log('--- ETHEREAL CREDENTIALS GENERATED ---');
        console.log('User:', testAccount.user);
        console.log('Pass:', testAccount.pass);
        console.log('Login at: https://ethereal.email/login');
        console.log('--- .env UPDATED ---');

    } catch (error) {
        console.error('Error setting up Ethereal:', error.message);
    }
}

setupEthereal();
