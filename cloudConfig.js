const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'EduSync', // Folder name in Cloudinary
        allowed_formats: ['jpeg', 'png', 'jpg'],
        transformation: [{ width: 500, height: 500, crop: "fill" }] // Basic image transformation
    }
});

module.exports = {
    cloudinary,
    storage
};