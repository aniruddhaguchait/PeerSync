// Load environment variables for DB_URL
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const Project = require('./models/project');
const User = require('./models/user');
const Task = require('./models/task');

const dbUrl = process.env.ATLAS_DB_URL || process.env.DB_URL;
mongoose.connect(dbUrl)
    .then(() => console.log('MongoDB Connected for Seeding!'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const seedDB = async () => {
    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    console.log("Cleared existing users, projects, and tasks.");

    // Create some demo users
    const user1 = new User({
        email: 'alice@example.com',
        username: 'alice',
        skills: ['React', 'Node.js', 'MongoDB'],
        interests: ['Web Dev', 'AI', 'Gaming'],
        domainTags: ['Fullstack', 'Frontend']
    });
    const registeredUser1 = await User.register(user1, 'password');

    const user2 = new User({
        email: 'bob@example.com',
        username: 'bob',
        skills: ['Python', 'Data Science', 'Machine Learning'],
        interests: ['AI', 'Data Analysis'],
        domainTags: ['Backend', 'Data']
    });
    const registeredUser2 = await User.register(user2, 'password');

    const user3 = new User({
        email: 'charlie@example.com',
        username: 'charlie',
        skills: ['UI/UX Design', 'Figma', 'Graphic Design'],
        interests: ['Design', 'User Experience'],
        domainTags: ['Design', 'Frontend']
    });
    const registeredUser3 = await User.register(user3, 'password');

    console.log("Created demo users.");

    // Create demo projects
    const project1 = new Project({
        title: 'EduVerse Platform',
        description: 'A web-based platform for student project collaboration and management.',
        tags: ['Web Dev', 'Fullstack', 'Node.js', 'MongoDB', 'EJS'],
        owner: registeredUser1._id,
        members: [registeredUser1._id, registeredUser2._id],
        status: 'In Progress',
        images: [
            { url: 'https://res.cloudinary.com/dksas2kn7/image/upload/v1772306649/susan-q-yin-2JIvboGLeho-unsplash_ohgnri.jpg', filename: 'EduSync/edusync-banner_x1y2z3.png' }
        ]
    });
    await project1.save();
    registeredUser1.projects.push(project1._id); // Add project to user's project list
    registeredUser2.projects.push(project1._id);
    await registeredUser1.save();
    await registeredUser2.save();

    const project2 = new Project({
        title: 'AI Chatbot for Learning',
        description: 'Develop an intelligent chatbot to assist students with their coursework.',
        tags: ['AI', 'Python', 'Machine Learning', 'NLP'],
        owner: registeredUser2._id,
        members: [registeredUser2._id, registeredUser3._id],
        status: 'Open',
        images: [
            { url: 'https://res.cloudinary.com/dksas2kn7/image/upload/v1772306762/julien-tromeur-6UDansS-rPI-unsplash_l2ionb.jpg', filename: 'EduSync/chatbot-concept_a4b5c6.png' }
        ]
    });
    await project2.save();
    registeredUser2.projects.push(project2._id);
    registeredUser3.projects.push(project2._id);
    await registeredUser2.save();
    await registeredUser3.save();

    console.log("Created demo projects.");

    // Create demo tasks
    const task1 = new Task({
        title: 'Setup Frontend UI with Bootstrap',
        description: 'Implement responsive design for user profiles and project listings.',
        status: 'Doing',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        assignee: registeredUser1._id,
        project: project1._id
    });
    await task1.save();

    const task2 = new Task({
        title: 'Design Database Schema for Projects',
        description: 'Outline the MongoDB schema for projects, users, and tasks.',
        status: 'Done',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        assignee: registeredUser2._id,
        project: project1._id
    });
    await task2.save();

    const task3 = new Task({
        title: 'Research NLP Libraries for Chatbot',
        description: 'Investigate suitable Python libraries like NLTK or SpaCy.',
        status: 'To Do',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        assignee: registeredUser2._id,
        project: project2._id
    });
    await task3.save();

    console.log("Created demo tasks.");
    console.log("Database seeded successfully!");

    mongoose.connection.close();
};

seedDB().then(() => {
    console.log('MongoDB connection closed after seeding.');
});