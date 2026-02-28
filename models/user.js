const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    profileImage: {
        url: String,
        filename: String
    },
    skills: [{
        type: String // e.g., ['React', 'Node.js']
    }],
    interests: [{
        type: String // e.g., ['Web Development', 'AI']
    }],
    domainTags: [{
        type: String // e.g., ['Frontend', 'Backend', 'Data Science']
    }],
    projects: [{
        type: Schema.Types.ObjectId,
        ref: 'Project'
    }],
    isAdmin: { // Optional: for admin users
        type: Boolean,
        default: false
    }
});

// Passport-local-mongoose adds username, hash, and salt fields
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);