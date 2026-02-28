const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const { storeReturnTo } = require('../middleware');

// For profile image uploads
const multer = require('multer');
const { storage } = require('../cloudConfig');
const upload = multer({ storage });

router.route('/register')
    .get(users.renderRegister)
    .post(upload.single('user[profileImage]'), catchAsync(users.register)); // Allow profile image upload

router.route('/login')
    .get(users.renderLogin)
    .post(storeReturnTo, passport.authenticate('local', {
        failureFlash: true,
        failureRedirect: '/users/login'
    }), users.login);

router.get('/logout', users.logout);

router.get('/find-collaborators', users.getSuggestedCollaborators); // Collaborator suggestion route

router.route('/:id')
    .get(catchAsync(users.showUserProfile));

router.route('/:id/edit')
    .get(users.renderEditProfile)
    .put(upload.single('user[profileImage]'), catchAsync(users.updateUserProfile)); // Profile update with image

// TODO: Peer review submission endpoint (if you make it a separate route)
// router.post('/:projectId/review/:revieweeId', isLoggedIn, catchAsync(users.submitPeerReview));


module.exports = router;