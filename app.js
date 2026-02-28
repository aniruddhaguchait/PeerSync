// Load environment variables first
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const http = require('http'); // For Socket.io
const socketIo = require('socket.io'); // For Socket.io
const ChatMessage = require('./models/chatMessage');


const ExpressError = require('./utils/ExpressError');
const User = require('./models/user'); // User model for Passport

// Route Imports
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks'); // For tasks within projects
const chatRoutes = require('./routes/chat'); // Basic chat routes

// Database Connection
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/EduSync'; // Fallback for local
mongoose.connect(dbUrl)
    .then(() => console.log('MongoDB Connected!'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Set up EJS and layouts
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60, // lazy session update in seconds
    crypto: {
        secret: secret,
    },
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
    store,
    name: 'session', // Avoid default 'connect.sid'
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true, // Uncomment for HTTPS in production
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash Middleware (locals)
app.use((req, res, next) => {
    res.locals.currentUser = req.user; // Access logged-in user in all templates
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Root Route
app.get('/', (req, res) => {
    res.render('home'); // Create a simple home.ejs in views
});

// Route Handlers
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
// We'll nest task routes under projects for cleaner URLs: /projects/:projectId/tasks
app.use('/projects/:projectId/tasks', taskRoutes);
app.use('/projects/:projectId/chat', chatRoutes); // Basic chat endpoint


// Catch-all for unknown routes
app.use((req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});



// Global Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).render('error', { err }); // Create an error.ejs template
});

// Socket.io Setup
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');

    socket.on('joinProjectChat', (projectId) => {
        socket.join(projectId);
        console.log(`User joined chat for project: ${projectId}`);
    });

    // socket.on('sendChatMessage', ({ projectId, username, message }) => {
    //     io.to(projectId).emit('newChatMessage', { username, message, timestamp: new Date().toISOString() });
    //     console.log(`Message in project ${projectId}: ${username} - ${message}`);
    //     // TODO: Save message to database here if persistent chat is needed
    // });

    socket.on('sendChatMessage', async ({ projectId, username, message }) => {
    const chatMessage = new ChatMessage({
        project: projectId,
        username,
        message
    });
    await chatMessage.save();

    io.to(projectId).emit('newChatMessage', {
        username,
        message,
        timestamp: chatMessage.timestamp
    });

    console.log(`💬 Saved + broadcasted message in project ${projectId}: ${username} - ${message}`);
    });


    socket.on('disconnect', () => {
        console.log('User disconnected from WebSocket');
    });
});


// Server Listen
const port = process.env.PORT || 8080;
server.listen(port, () => { // Use 'server.listen' instead of 'app.listen' for Socket.io
    console.log(`Serving on port ${port}`);
});