var path = require("path");
const express = require("express");
var Call = require("./call");

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

const server = app.listen(3000, () => console.log(`Server has started.`));

var call = Call.create();
const users = {};

const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("Socket Connected");
  socket.on("new-user", ({ id, room }) => {
    users[socket.id] = { id, room };
    call.addPeer(id, room);
  });
  socket.on("disconnect", () => {
    console.log("Socket Disonnected");

    if (users[socket.id] != undefined) {
      socket.broadcast.emit("user-disconnected", users[socket.id].id);
      call.removePeer(users[socket.id].id, users[socket.id].room);
    }
  });
});

// Landing page
app.get("/", function (req, res) {
  res.render("index", {
    call: call,
  });
});

// app.post("/addpeer/:peerid", function (req, res) {
//   call.addPeer(req.param("peerid"));
//   res.json(call.toJSON());
// });

// app.post("/removepeer", function (req, res) {
//   console.log("remove");
//   console.log(call.peers);
//   call.removePeer(req.param("peerid"));
//   console.log(call.peers);
//   res.json(call.toJSON());
// });
