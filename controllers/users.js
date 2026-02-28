const User = require('../models/user');
const { cloudinary } = require('../cloudConfig'); // Import cloudinary

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
};

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        if (req.file) { // Check if a profile image was uploaded
            user.profileImage = { url: req.file.path, filename: req.file.filename };
        }
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => { // Auto-login after registration
            if (err) return next(err);
            req.flash('success', 'Welcome to EduSync!');
            res.redirect('/projects');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/users/register');
    }
};

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
};

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = res.locals.returnTo || '/projects'; // Use returnTo or default
    delete req.session.returnTo; // Clear returnTo
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
};

module.exports.showUserProfile = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate('projects'); // Populate projects created by user
    if (!user) {
        req.flash('error', 'User not found!');
        return res.redirect('/projects'); // Or to a generic error page
    }
    res.render('users/profile', { user });
};

module.exports.renderEditProfile = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || !user._id.equals(req.user._id)) { // Only allow editing own profile
        req.flash('error', 'You do not have permission to edit this profile!');
        return res.redirect(`/users/${id}`);
    }
    res.render('users/editProfile', { user });
};

module.exports.updateUserProfile = async (req, res) => {
    const { id } = req.params;
    // Ensure only the logged-in user can update their own profile
    if (!req.user._id.equals(id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/users/${id}`);
    }

    const { username, email, skills, interests, domainTags } = req.body.user;
    const user = await User.findByIdAndUpdate(id, {
        username,
        email,
        skills: skills.split(',').map(s => s.trim()),
        interests: interests.split(',').map(i => i.trim()),
        domainTags: domainTags.split(',').map(d => d.trim())
    }, { new: true });

    if (req.file) {
        if (user.profileImage && user.profileImage.filename) {
            await cloudinary.uploader.destroy(user.profileImage.filename); // Delete old image
        }
        user.profileImage = { url: req.file.path, filename: req.file.filename };
        await user.save();
    }

    req.flash('success', 'Profile updated successfully!');
    res.redirect(`/users/${user._id}`);
};

// TODO: Implement collaborator suggestion logic here
module.exports.getSuggestedCollaborators = async (req, res) => {
    const currentUser = req.user;
    if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    // Basic suggestion: Find users with similar skills/interests but not current user
    const currentSkills = currentUser.skills || [];
    const currentInterests = currentUser.interests || [];
    const currentDomainTags = currentUser.domainTags || [];

    const suggestedUsers = await User.find({
        _id: { $ne: currentUser._id }, // Not the current user
        $or: [
            { skills: { $in: currentSkills } },
            { interests: { $in: currentInterests } },
            { domainTags: { $in: currentDomainTags } }
        ]
    }).limit(5); // Limit suggestions

    res.render('users/findCollaborators', { suggestedUsers });
    // Or for an API endpoint: res.json(suggestedUsers);
};

// TODO: Basic Peer Review Logic (more complex in real app)
// You might integrate this into a project page or a dedicated review page
module.exports.submitPeerReview = async (req, res) => {
    const { projectId, revieweeId } = req.params;
    const { rating, feedback } = req.body;
    // Find project, find reviewee, save review
    // For simplicity, we'll assume a project-centric review system
    req.flash('success', `Review for ${revieweeId} submitted! (This is a placeholder)`);
    res.redirect(`/projects/${projectId}`);
};