const express = require('express');
const router = express.Router({ mergeParams: true }); // Get projectId from parent
const catchAsync = require('../utils/catchAsync');
const chat = require('../controllers/chat');
const { isLoggedIn, isProjectMember } = require('../middleware');

router.get('/', isLoggedIn, isProjectMember, catchAsync(chat.renderChat));

module.exports = router;