// This script would be run once manually or through a separate command
// after initial setup. Not integrated into `app.js` or `seed.js` by default
// to avoid accidental admin creation.

// Load environment variables
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const User = require('../models/user');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/EduSync';
mongoose.connect(dbUrl)
    .then(() => console.log('MongoDB Connected for Admin Init!'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const createAdmin = async () => {
    try {
        const adminEmail = 'admin@edusync.com';
        const adminUsername = 'admin';
        const adminPassword = 'adminpassword'; // CHANGE THIS!

        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            console.log(`Admin user '${adminUsername}' already exists.`);
        } else {
            const newAdmin = new User({
                email: adminEmail,
                username: adminUsername,
                isAdmin: true, // Add an isAdmin flag to your User model
                skills: ['Fullstack', 'DevOps', 'Project Management'],
                interests: ['System Admin', 'Security'],
                domainTags: ['Admin']
            });
            await User.register(newAdmin, adminPassword);
            console.log(`Admin user '${adminUsername}' created successfully!`);
        }
    } catch (e) {
        console.error('Error creating admin user:', e);
    } finally {
        mongoose.connection.close();
    }
};

createAdmin();