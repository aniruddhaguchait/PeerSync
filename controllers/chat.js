// const Project = require('../models/project');
// // We might add a ChatMessage model later if we want persistent chat history

// module.exports.renderChat = async (req, res) => {
//     const { projectId } = req.params;
//     const project = await Project.findById(projectId);
//     if (!project) {
//         req.flash('error', 'Project not found for chat!');
//         return res.redirect('/projects');
//     }
//     // TODO: Fetch past messages from DB here if persistent chat is implemented
//     res.render('chat/show', { project });
// };

// // This controller might also contain logic to save messages to the DB
// // module.exports.saveChatMessage = async (projectId, username, message) => {
// //     // Save message to a ChatMessage model associated with the project
// // };

const Project = require('../models/project');
const ChatMessage = require('../models/chatMessage');

module.exports.renderChat = async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    req.flash('error', 'Project not found for chat!');
    return res.redirect('/projects');
  }

  // Fetch previous messages (sorted oldest→newest)
  const messages = await ChatMessage.find({ project: projectId }).sort({ timestamp: 1 });

  res.render('chat/show', { project, messages });
};
