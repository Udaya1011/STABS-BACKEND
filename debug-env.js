require('dotenv').config();

console.log('--- ENV CHECK ---');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET);

const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes('your_') &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
    !process.env.CLOUDINARY_API_KEY.includes('your_') &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== 'your_api_secret' &&
    !process.env.CLOUDINARY_API_SECRET.includes('your_');

console.log('IS CONFIGURED:', isCloudinaryConfigured);

if (isCloudinaryConfigured) {
    console.log('RESULT: Cloudinary should be active');
} else {
    console.log('RESULT: Local storage should be active');
}
