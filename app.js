//dependencies and setup
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./models/user");
const app = express();
const path = require("path");

require("dotenv").config();

const router = (global.router = express.Router());
const port = process.env.PORT || 5000;
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");

app.use(express.static("public"));

//------------- Initialising passport ----------------

app.use(
  require("express-session")({
    secret: "This the secret message for authentication",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

//------------------------   Authentication Routes  -------------------------

app.get("/login", function (req, res) {
  res.render("login.ejs");
});
app.get("/signup", function (req, res) {
  res.render("signup.ejs");
});

app.post("/signup", function (req, res) {
  User.register(
    new User({
      username: req.body.username,
      name: req.body.name,
      phone: req.body.phone,
    }),
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
      }
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  );
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// ------------------------ Authentication Ends ------------------------------

//backend routes
app.use("/api/room", require("./routes/room.js"));
app.use(router);

//frontend routes
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/friendplay/:roomcode", (req, res) => {
  res.render("friendplay", { room_code: req.params.roomcode });
});

app.get("/room_details", (req, res) => {
  res.render("room_details");
});
app.get("/profile/:user_id", (req, res) => {
  res.render("profile", { user_id: req.params.user_id });
});

//socket.io
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("someone connected to a socket");
  socket.on("join_room", (room_code) => {
    console.log("user joined room " + room_code);
    socket.join(room_code);
    io.to(room_code).emit("share_id");
  });
  socket.on("share_id2", (room_code, id) => {
    io.to(room_code).emit("webrtc_id", id);
    console.log("room " + room_code + " id " + id);
  });
});

server.listen(port, () => {
  console.log(`vFit server listening at http://localhost:${port}`);
});
