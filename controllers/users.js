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
            req.flash('success', 'Welcome to PeerSync!');
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
    if (!req.user) {
        req.flash("error", "Please login first.");
        return res.redirect("/users/login");
    }

    const currentUser = await User.findById(req.user._id);

    const currentSkills = currentUser.skills || [];
    const currentInterests = currentUser.interests || [];
    const currentDomainTags = currentUser.domainTags || [];

  // ✅ if user has nothing filled, show some random users (or latest users)
    let suggestedUsers = [];
    if (
        currentSkills.length === 0 &&
        currentInterests.length === 0 &&
        currentDomainTags.length === 0
    ) {
        suggestedUsers = await User.find({ _id: { $ne: currentUser._id } })
        .sort({ _id: -1 })
        .limit(12);
        return res.render("users/findCollaborators", {
        suggestedUsers,
        infoMsg: "Add skills/interests in your profile to get better suggestions.",
        });
    }

  // ✅ build query only with non-empty arrays
    const orConditions = [];
    if (currentSkills.length) orConditions.push({ skills: { $in: currentSkills } });
    if (currentInterests.length) orConditions.push({ interests: { $in: currentInterests } });
    if (currentDomainTags.length) orConditions.push({ domainTags: { $in: currentDomainTags } });

    suggestedUsers = await User.find({
        _id: { $ne: currentUser._id },
        $or: orConditions,
    }).limit(12);

    res.render("users/findCollaborators", { suggestedUsers, infoMsg: null });
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