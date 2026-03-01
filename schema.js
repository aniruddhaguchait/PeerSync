const Joi = require('joi');

module.exports.projectSchema = Joi.object({
    project: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        tags: Joi.string().required(), // Comma-separated tags
        // collaborators: Joi.array().items(Joi.string()), // Will handle dynamically
        // owner: Joi.string().required(), // Will be set by server
        status: Joi.string().valid('Open', 'In Progress', 'Completed', 'Archived').default('Open')
    }).required()
});

module.exports.taskSchema = Joi.object({
    task: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().allow("", null),
        status: Joi.string().valid("To Do", "Doing", "Done").required(),
        dueDate: Joi.date().allow("", null),

        // ✅ allow this (THIS is the fix)
        assigneeUsername: Joi.string().allow("", null),
    }).unknown(true).required(), // allow extra keys like assigneeUsername or CSRF tokens
});

module.exports.userProfileSchema = Joi.object({
    user: Joi.object({
        username: Joi.string().min(3).required(),
        email: Joi.string().email().required(),
        skills: Joi.string().allow(''), // Comma-separated skills
        interests: Joi.string().allow(''), // Comma-separated interests
        domainTags: Joi.string().allow(''), // Comma-separated domain tags
        // profileImage: Joi.string().allow('') // Handled by Cloudinary upload
    }).required()
}).unknown(true); // Allow other fields like password for now if they exist, but generally filter