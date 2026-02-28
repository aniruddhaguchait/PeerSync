// Load environment variables first
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");

const MongoStore = require("connect-mongo").default;

const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const methodOverride = require("method-override");
const http = require("http");
const socketIo = require("socket.io");
const ChatMessage = require("./models/chatMessage");

const ExpressError = require("./utils/ExpressError");
const User = require("./models/user");

// Routes
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const chatRoutes = require("./routes/chat");

// ✅ Atlas DB URL (fallback local optional)
const dbUrl = process.env.ATLAS_DB_URL || process.env.DB_URL;

// ✅ Mongo connection (Atlas-friendly options)
mongoose.connect(dbUrl, {
        serverSelectionTimeoutMS: 10000,
        family: 4, // helps on Windows DNS / IPv6 issues
    })
    .then(() => console.log("MongoDB Connected ✅"))
    .catch((err) => console.error("MongoDB Connection Error ❌:", err));

// Views
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session Configuration
const secret = process.env.SECRET || "thisshouldbeabettersecret!";

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: { secret },
});

store.on("error", (e) => {
    console.log("SESSION STORE ERROR ❌", e);
});

const sessionConfig = {
    store,
    name: "session",
    secret,
    resave: false,
    saveUninitialized: false, // ✅ recommended
    cookie: {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production", // enable only on HTTPS
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionConfig));
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash locals
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// Root
app.get("/", (req, res) => {
    res.render("home");
});

// Routes
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/projects/:projectId/tasks", taskRoutes);
app.use("/projects/:projectId/chat", chatRoutes);

// 404
app.use((req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh No, Something Went Wrong!";
    res.status(statusCode).render("error", { err });
});

// Socket.io
const server = http.createServer(app);
const io = socketIo(server);

io.on("connection", (socket) => {
    console.log("A user connected via WebSocket");

socket.on("joinProjectChat", (projectId) => {
    socket.join(projectId);
    console.log(`User joined chat for project: ${projectId}`);
});

socket.on("sendChatMessage", async ({ projectId, username, message }) => {
    const chatMessage = new ChatMessage({
        project: projectId,
        username,
        message,
    });

    await chatMessage.save();

    io.to(projectId).emit("newChatMessage", {
        username,
        message,
        timestamp: chatMessage.timestamp,
    });

    console.log(
        `💬 Saved + broadcasted message in project ${projectId}: ${username} - ${message}`
    );
});

    socket.on("disconnect", () => {
        console.log("User disconnected from WebSocket");
    });
});

// Listen
const port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log(`Serving on port ${port}`);
});