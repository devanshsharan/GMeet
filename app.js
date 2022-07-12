const express = require('express');
const cookieSession = require('cookie-session');
const passport = require('passport');
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');
const mongoose = require('mongoose');
const keys = require('./config/keys');
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io");

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer( {
  debug: true,
});
const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [keys.session.cookieKey]
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(keys.mongodb.dbURI, () => {
    console.log('connected to mongodb');
});

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

app.get('/', (req, res) => {
    res.render('home', { user: req.user });
});


app.get("/:profile", (req, res) => {
  res.render("profile", { roomId: req.params.room });
});
io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).broadcast.emit("user-connected", userId);
  
      socket.on("message", (message) => {
        io.to(roomId).emit("createMessage", message);
      });
    });
});

app.listen(3000, () => {
    console.log('app now listening for requests on port 3000');
});
