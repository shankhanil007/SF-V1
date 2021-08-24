const PRE = "DELTA";
const SUF = "MEET";
var room_id;
var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
var local_stream;

var peer = null;
var currentPeer = null;
const videoGrid = document.getElementById("video-grid");
const socket = io();

socket.on("user-disconnected", (userId) => {
  console.log(userId);
  const video = document.getElementById(userId);
  video.remove();
});

//---------------------------------------------------------------------------------------

const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

function onResults(results) {
  if (!results.poseLandmarks) {
    return;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
    color: "#00FF00",
    lineWidth: 4,
  });
  drawLandmarks(canvasCtx, results.poseLandmarks, {
    color: "#FF0000",
    lineWidth: 2,
  });
  canvasCtx.restore();
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  },
});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
pose.onResults(onResults);
//----------------------------------------------------------------------------------------

function createRoom() {
  console.log("Creating Room");
  let room = document.getElementById("room-input").value;
  if (room == " " || room == "") {
    alert("Please enter room number");
    return;
  }

  peer = new Peer();
  peer.on("open", (id) => {
    console.log("Peer Connected with ID: ", id);
    socket.emit("new-user", id);

    hideModal();
    getUserMedia(
      { video: true, audio: false },
      (stream) => {
        local_stream = stream;
        setLocalStream(local_stream);
      },
      (err) => {
        console.log(err);
      }
    );
    notify("Waiting for peer to join.");
  });

  peer.on("call", (call) => {
    call.answer(local_stream);
    const video = document.createElement("video");
    video.setAttribute("id", call.peer);
    call.on("stream", (stream) => {
      setRemoteStream(stream, video);
    });
    currentPeer = call;
  });
}

function joinRoom() {
  console.log("Joining Room");
  let room = document.getElementById("room-input").value;
  if (room == " " || room == "") {
    alert("Please enter room number");
    return;
  }
  room_id = PRE + room + SUF;
  hideModal();
  peer = new Peer();
  peer.on("open", (id) => {
    console.log("Connected with Id: " + id);
    socket.emit("new-user", id);
    // $.getScript("users.js", function () {
    //   console.log(addUser(id));
    // });

    // $.post("/addpeer/" + id);

    getUserMedia(
      { video: true, audio: false },
      (stream) => {
        local_stream = stream;
        setLocalStream(local_stream);
        notify("Joining peer");

        peer.on("call", function (call) {
          // Answer the call, providing our mediaStream
          call.answer(local_stream);
          const video = document.createElement("video");
          video.setAttribute("id", call.peer);
          call.on("stream", (stream) => {
            setRemoteStream(stream, video);
          });
        });

        call.peers.forEach(function (id) {
          const calls = peer.call(id, stream);
          const video = document.createElement("video");
          video.setAttribute("id", id);
          calls.on("stream", (stream) => {
            setRemoteStream(stream, video);
          });
          calls.on("close", () => {
            console.log("Closed");
            video.remove();
          });
          currentPeer = calls;
        });
      },
      (err) => {
        console.log(err);
      }
    );
  });
}

function setLocalStream(stream) {
  console.log(call);

  let video = document.getElementById("local-video");
  video.srcObject = stream;
  video.muted = true;
  video.play();

  // const camera = new Camera(video, {
  //   onFrame: async () => {
  //     await pose.send({ image: video });
  //   },
  //   width: 300,
  //   height: 250,
  // });
  // camera.start();
}

function setRemoteStream(stream, video) {
  video.srcObject = stream;
  video.play();
  videoGrid.append(video);
}

function hideModal() {
  document.getElementById("entry-modal").hidden = true;
}

function notify(msg) {
  let notification = document.getElementById("notification");
  notification.innerHTML = msg;
  notification.hidden = false;
  setTimeout(() => {
    notification.hidden = true;
  }, 3000);
}

// Learnt how to run methods from another JS file and how to make API requests from JS using jQuery
