var path = require("path");
const express = require("express");
var Call = require("./call");

var call = Call.create();

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

// Landing page
app.get("/", function (req, res) {
  res.render("index", {
    call: call,
  });
});

app.post("/addpeer/:peerid", function (req, res) {
  call.addPeer(req.param("peerid"));

  res.json(call.toJSON());
});

app.listen(process.env.PORT || 3000, () => console.log(`Server has started.`));
