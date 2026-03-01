const Project = require('../models/project');
const Task = require('../models/task');
const User = require('../models/user');

module.exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    req.flash('error', 'Project not found!');
    return res.redirect('/projects');
  }

  const taskData = req.body.task;

  // ✅ read from task now
  const { assigneeUsername } = req.body.task;

  let assignee = null;
  if (assigneeUsername) {
    assignee = await User.findOne({ username: assigneeUsername });
    if (!assignee) {
      req.flash('error', 'Assignee user not found!');
      return res.redirect(`/projects/${projectId}`);
    }
  }

  // ✅ remove assigneeUsername so it doesn't get saved into Task schema accidentally
  delete taskData.assigneeUsername;

  const task = new Task({
    ...taskData,
    project: projectId,
    assignee: assignee ? assignee._id : null,
  });

  await task.save();

  project.tasks.push(task._id);
  await project.save();
  console.log("REQ BODY =>", req.body);
  req.flash('success', 'Successfully added a new task!');
  res.redirect(`/projects/${projectId}`);
};

module.exports.updateTask = async (req, res) => {
  const { projectId, taskId } = req.params;

  const taskData = req.body.task;

  // ✅ read from task now
  const { assigneeUsername } = req.body.task;

  let assignee = null;

  if (assigneeUsername) {
    assignee = await User.findOne({ username: assigneeUsername });
    if (!assignee) {
      req.flash('error', 'Assignee user not found!');
      return res.redirect(`/projects/${projectId}`);
    }
    taskData.assignee = assignee._id;
  } else {
    taskData.assignee = null;
  }

  // ✅ prevent saving assigneeUsername in Task doc
  delete taskData.assigneeUsername;

  const task = await Task.findByIdAndUpdate(taskId, taskData, { new: true });

  if (!task) {
    req.flash('error', 'Task not found!');
    return res.redirect(`/projects/${projectId}`);
  }

  req.flash('success', 'Task updated successfully!');
  res.redirect(`/projects/${projectId}`);
};

module.exports.deleteTask = async (req, res) => {
  const { projectId, taskId } = req.params;

  await Project.findByIdAndUpdate(projectId, { $pull: { tasks: taskId } });
  await Task.findByIdAndDelete(taskId);

  req.flash('success', 'Task deleted successfully!');
  res.redirect(`/projects/${projectId}`);
};