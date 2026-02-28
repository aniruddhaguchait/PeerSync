const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const projects = require('../controllers/projects');
const { isLoggedIn, validateProject, isProjectOwner } = require('../middleware');

// For project image uploads
const multer = require('multer');
const { storage } = require('../cloudConfig');
const upload = multer({ storage });

// Analytics Dashboard (if you want it as a route)
router.get('/analytics/dashboard', isLoggedIn, catchAsync(projects.getAnalytics));

router.route('/')
    .get(catchAsync(projects.index))
    .post(isLoggedIn, upload.array('project[images]'), validateProject, catchAsync(projects.createProject)); // Allow multiple images

router.get('/new', isLoggedIn, projects.renderNewForm);

router.route('/:projectId')
    .get(isLoggedIn, catchAsync(projects.showProject))
    .put(isLoggedIn, isProjectOwner, upload.array('project[images]'), validateProject, catchAsync(projects.updateProject))
    .delete(isLoggedIn, isProjectOwner, catchAsync(projects.deleteProject));

router.get('/:projectId/edit', isLoggedIn, isProjectOwner, catchAsync(projects.renderEditForm));

// Project Member Management
router.post('/:projectId/members/add', isLoggedIn, isProjectOwner, catchAsync(projects.addMember));
router.delete('/:projectId/members/:memberId', isLoggedIn, isProjectOwner, catchAsync(projects.removeMember));

// Allow any logged-in user to join a project
router.post('/:projectId/join', isLoggedIn, catchAsync(projects.joinProject));

module.exports = router;