const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['To Do', 'Doing', 'Done'],
        default: 'To Do'
    },
    dueDate: Date,
    assignee: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    project: { // Reference to the parent project
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);