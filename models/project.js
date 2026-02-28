const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Task = require('./task'); // Import Task model for pre-hook

const ProjectSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tags: [{
        type: String // e.g., ['Web Dev', 'Fullstack']
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Completed', 'Archived'],
        default: 'Open'
    },
    images: [
        {
            url: String,
            filename: String
        }
    ],
    tasks: [{ // Embed tasks by reference
        type: Schema.Types.ObjectId,
        ref: 'Task'
    }],

    // Add fields for peer review scores if needed
//     peerReviews: [{
//         reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
//         reviewee: { type: Schema.Types.ObjectId, ref: 'User' },
//         rating: Number, // e.g., 1-5
//         feedback: String,
//         createdAt: { type: Date, default: Date.now }
//     }]
 }, { timestamps: true }); // Automatically add createdAt and updatedAt

// Middleware to delete associated tasks when a project is deleted
ProjectSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Task.deleteMany({
            _id: {
                $in: doc.tasks
            }
        });
    }
});

module.exports = mongoose.model('Project', ProjectSchema);