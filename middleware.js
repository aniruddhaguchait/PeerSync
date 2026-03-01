const { projectSchema, taskSchema, userProfileSchema } = require('./schema'); // Joi schemas
const ExpressError = require('./utils/ExpressError');
const Project = require('./models/project');
const Task = require('./models/task'); // We'll need a Task model

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl; // Store the URL user was trying to access
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/users/login');
    }
    next();
};

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

// Joi validation middleware for Projects
module.exports.validateProject = (req, res, next) => {
    const { error } = projectSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

// Joi validation middleware for Tasks

module.exports.validateTask = (req, res, next) => {
    // allowUnknown true makes sure fields like assigneeUsername (and any other
    // non-schema properties such as CSRF tokens) don't trigger a validation error.
    const { error } = taskSchema.validate(req.body, { allowUnknown: true });
    if (error) {
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(msg, 400);
    }
    next();
};

// Joi validation middleware for User Profile Updates
module.exports.validateUserProfile = (req, res, next) => {
    const { error } = userProfileSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};


// Middleware to check if current user is the project owner
module.exports.isProjectOwner = async (req, res, next) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project.owner.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/projects/${projectId}`);
    }
    next();
};

// Middleware to check if current user is a project member for certain actions
module.exports.isProjectMember = async (req, res, next) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project.members.includes(req.user._id) && !project.owner.equals(req.user._id)) {
        req.flash('error', 'You are not a member of this project!');
        return res.redirect(`/projects/${projectId}`);
    }
    next();
};

// Middleware to check if current user is the task assignee or project owner
module.exports.isTaskAssigneeOrOwner = async (req, res, next) => {
    const { projectId, taskId } = req.params;
    const task = await Task.findById(taskId).populate('assignee');
    const project = await Project.findById(projectId);

    if (!task) {
        req.flash('error', 'Task not found!');
        return res.redirect(`/projects/${projectId}`);
    }

    if (!task.assignee || (!task.assignee.equals(req.user._id) && !project.owner.equals(req.user._id))) {
        req.flash('error', 'You do not have permission to modify this task.');
        return res.redirect(`/projects/${projectId}`);
    }
    next();
};