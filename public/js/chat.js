document.addEventListener('DOMContentLoaded', () => {
    const socket = io(); // Connect to the Socket.io server

    const chatMessages = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const projectId = chatMessages ? chatMessages.dataset.projectId : null; // Get project ID from HTML
    const username = chatMessages ? chatMessages.dataset.username : 'Guest'; // Get username from HTML

    if (projectId) {
        socket.emit('joinProjectChat', projectId);

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatInput.value;
            if (message) {
                socket.emit('sendChatMessage', { projectId, username, message });
                chatInput.value = ''; // Clear input
            }
        });

        socket.on('newChatMessage', (data) => {
            const item = document.createElement('li');
            item.classList.add('list-group-item');
            item.innerHTML = `<strong>${data.username}:</strong> ${data.message} <small class="text-muted float-end">${new Date(data.timestamp).toLocaleTimeString()}</small>`;
            chatMessages.appendChild(item);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
        });
    }
});