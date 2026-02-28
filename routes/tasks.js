const express = require('express');
const router = express.Router({ mergeParams: true }); // Important to get projectId from parent route
const catchAsync = require('../utils/catchAsync');
const tasks = require('../controllers/tasks');
const { isLoggedIn, validateTask, isProjectMember, isTaskAssigneeOrOwner } = require('../middleware');

router.post('/', isLoggedIn, isProjectMember, validateTask, catchAsync(tasks.createTask));

router.route('/:taskId')
    .put(isLoggedIn, isProjectMember, isTaskAssigneeOrOwner, validateTask, catchAsync(tasks.updateTask))
    .delete(isLoggedIn, isProjectMember, isTaskAssigneeOrOwner, catchAsync(tasks.deleteTask));

module.exports = router;