const Project = require('../models/project');
const User = require('../models/user');
const Task = require('../models/task');
const { cloudinary } = require('../cloudConfig');

module.exports.index = async (req, res) => {
    const projects = await Project.find({}).populate('owner');
    res.render('projects/index', { projects });
};

module.exports.renderNewForm = (req, res) => {
    res.render('projects/new');
};

module.exports.createProject = async (req, res) => {
    const { title, description, tags, status } = req.body.project;
    const project = new Project({
        title,
        description,
        tags: tags.split(',').map(t => t.trim()),
        status,
        owner: req.user._id,
        members: [req.user._id] // Owner is also a member
    });

    if (req.files && req.files.length) { // Check if files were uploaded
        project.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    }

    await project.save();
    req.user.projects.push(project._id); // Add project to owner's list
    await req.user.save();
    req.flash('success', 'Successfully made a new project!');
    res.redirect(`/projects/${project._id}`);
};

module.exports.showProject = async (req, res) => {
    const project = await Project.findById(req.params.projectId)
        .populate('owner')
        .populate({
            path: 'members',
            select: 'username profileImage' // Only fetch username and profileImage for members
        })
        .populate({
            path: 'tasks', // Populate tasks associated with the project
            populate: {
                path: 'assignee',
                select: 'username profileImage' // Populate assignee's username
            }
        });
    if (!project) {
        req.flash('error', 'Cannot find that project!');
        return res.redirect('/projects');
    }
    const isMember = project.members.some(member => member._id.equals(req.user._id));

    // For peer review: get other members of the project
    const otherMembers = project.members.filter(member => !member._id.equals(req.user._id));

    res.render('projects/show', { project, isMember, otherMembers });
};

module.exports.renderEditForm = async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
        req.flash('error', 'Cannot find that project!');
        return res.redirect('/projects');
    }
    res.render('projects/edit', { project });
};

module.exports.updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { title, description, tags, status } = req.body.project;
    const project = await Project.findByIdAndUpdate(projectId, {
        title,
        description,
        tags: tags.split(',').map(t => t.trim()),
        status
    }, { new: true });

    if (req.files && req.files.length) {
        const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
        project.images.push(...newImages);
    }
    // Handle deletion of old images if checkbox is checked
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        project.images = project.images.filter(img => !req.body.deleteImages.includes(img.filename));
    }

    await project.save();
    req.flash('success', 'Successfully updated project!');
    res.redirect(`/projects/${project._id}`);
};

module.exports.deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findByIdAndDelete(projectId);
    // Remove project from owner's project list
    await User.findByIdAndUpdate(project.owner, { $pull: { projects: projectId } });
    // Delete all associated images from Cloudinary
    for (let img of project.images) {
        await cloudinary.uploader.destroy(img.filename);
    }
    req.flash('success', 'Successfully deleted project!');
    res.redirect('/projects');
};

module.exports.addMember = async (req, res) => {
    const { projectId } = req.params;
    const { newMemberUsername } = req.body;
    const project = await Project.findById(projectId);
    const newMember = await User.findOne({ username: newMemberUsername });

    if (!project || !newMember) {
        req.flash('error', 'Project or User not found.');
        return res.redirect(`/projects/${projectId}`);
    }
    if (project.members.includes(newMember._id)) {
        req.flash('error', `${newMemberUsername} is already a member.`);
        return res.redirect(`/projects/${projectId}`);
    }

    project.members.push(newMember._id);
    await project.save();
    newMember.projects.push(project._id); // Add project to new member's list
    await newMember.save();

    req.flash('success', `${newMemberUsername} added to the project.`);
    res.redirect(`/projects/${projectId}`);
};

// ... (Previous content of controllers/projects.js)

module.exports.removeMember = async (req, res) => {
    const { projectId, memberId } = req.params;
    const project = await Project.findByIdAndUpdate(projectId, { $pull: { members: memberId } });
    const member = await User.findByIdAndUpdate(memberId, { $pull: { projects: projectId } }); // Remove project from member's list
    req.flash('success', 'Member removed from project.');
    res.redirect(`/projects/${projectId}`);
};

module.exports.joinProject = async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    const user = req.user;

    if (!project) {
        req.flash('error', 'Project not found.');
        return res.redirect('/projects');
    }

    // Prevent duplicates
    if (project.members.some(member => member.equals(user._id))) {
        req.flash('info', 'You are already a member of this project.');
        return res.redirect(`/projects/${projectId}`);
    }

    // Add the user to the project and vice versa
    project.members.push(user._id);
    await project.save();

    user.projects.push(project._id);
    await user.save();

    req.flash('success', 'You have successfully joined this project!');
    res.redirect(`/projects/${projectId}`);
};


// Analytics Dashboard Data (simplified)
module.exports.getAnalytics = async (req, res) => {
    const totalProjects = await Project.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const completedTasksCount = await Task.countDocuments({ status: 'Done' });

    // Projects by status (example)
    const projectsByStatus = await Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.render('analytics/dashboard', {
        totalProjects,
        totalUsers,
        completedTasksCount,
        projectsByStatus
    });
};