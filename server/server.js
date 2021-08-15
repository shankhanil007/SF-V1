const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
// Here is the actual HTTP server
// In this case, HTTPS (secure) server
const https = require("https");

// Security options - key and certificate
const options = {
  key: fs.readFileSync("star_itp_io.key"),
  cert: fs.readFileSync("star_itp_io.pem"),
};

const app = express();
app.use(cors());

// // CORS middleware
// app.use(
//   cors({
//     origin: "https://editor.p5js.org",
//     optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
//   })
// );

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// We pass in the Express object and the options object
var httpServer = https.createServer(options, app);

// Default HTTPS port
httpServer.listen(443, () => {
  console.log(`Listening on port ${PORT}`);
});

/* 
This server simply keeps track of the peers all in one big "room"
and relays signal messages back and forth.
*/
let rooms = {};
//let peers = [];

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require("socket.io")(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on(
  "connection",

  // We are given a websocket object in our function
  function (socket) {
    console.log("We have a new client: " + socket.id);
    // peers.push({socket: socket});

    socket.on("room_connect", function (room) {
      console.log("room_connect", room);

      if (!rooms.hasOwnProperty(room)) {
        console.log("room doesn't exist, creating it");
        rooms[room] = [];
      }
      rooms[room].push(socket);
      socket.room = room;

      console.log(rooms);

      let ids = [];
      for (let i = 0; i < rooms[socket.room].length; i++) {
        ids.push(rooms[socket.room][i].id);
      }
      console.log("ids length: " + ids.length);
      socket.emit("listresults", ids);
    });

    socket.on("list", function () {
      let ids = [];
      for (let i = 0; i < rooms[socket.room].length; i++) {
        ids.push(rooms[socket.room][i].id);
      }
      console.log("ids length: " + ids.length);
      socket.emit("listresults", ids);
    });

    // Relay signals back and forth
    socket.on("signal", (to, from, data) => {
      console.log("SIGNAL", to, data);
      let found = false;
      for (let i = 0; i < rooms[socket.room].length; i++) {
        console.log(rooms[socket.room][i].id, to);
        if (rooms[socket.room][i].id == to) {
          console.log("Found Peer, sending signal");
          rooms[socket.room][i].emit("signal", to, from, data);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log("never found peer");
      }
    });

    socket.on("disconnect", function () {
      console.log("Client has disconnected " + socket.id);
      if (rooms[socket.room]) {
        // Check on this
        // Tell everyone first
        let which = -1;
        for (let i = 0; i < rooms[socket.room].length; i++) {
          if (rooms[socket.room][i].id != socket.id) {
            rooms[socket.room][i].emit("peer_disconnect", socket.id);
          } else {
            which = i;
          }
        }
        // Now remove from array
        if (rooms[socket.room][which].id == socket.id) {
          rooms[socket.room].splice(which, 1);
        }

        // This could fail if someone joins while the loops are in progress
        // Maybe should be using associative arrays all the way around here
      }
    });
  }
);
