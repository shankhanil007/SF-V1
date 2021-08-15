let otherVideo;
let video;
let poseNet;
let poses = [];
var stage = "";
var counter = 0;
var flag = 0;

function setup() {
  var canvas = createCanvas(640, 480);
  let constraints = { audio: true, video: true };
  console.log("Room ID from p5 is", ROOM_ID);

  video = createCapture(constraints, function (stream) {
    p5l = new p5LiveMedia(this, "CAPTURE", stream, ROOM_ID);
    p5l.on("data", gotData);
    p5l.on("stream", gotStream);
  });
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function (results) {
    poses = results;
  });

  video.muted = true;
  video.hide();
}

function modelReady() {
  console.log("Model Loaded");
}

function draw() {
  image(video, 0, 0, width, height);

  // strokeWeight(4);
  // stroke(0, 0, 255);
  // fill(255, 0, 0, 0);
  // rect(200, 120, 260, 200);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  // drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];

      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }

  // if (poses.length > 0) {
  //   pose = poses[0].pose;

  //   if (pose.keypoints.length >= 7) {
  //     let shoulder = pose.keypoints[5].position.y;
  //     let elbow = pose.keypoints[7].position.y;
  //     let diff = elbow - shoulder;
  //     if (diff < 110 && flag == 1) {
  //       flag = 0;
  //       counter += 1;
  //       console.log(counter);
  //     } else if (diff >= 110) flag = 1;
  //   }
  // }

  // -------------------------------------- Skipping ----------------------------------
  // if (poses.length > 0) {
  //   pose = poses[0].pose;

  //   if (pose.keypoints.length >= 5) {
  //     let shoulder = pose.keypoints[5].position.y;
  //     if (shoulder < 110 && flag == 1) {
  //       flag = 0;
  //       counter += 1;
  //       print(counter);
  //     } else if (shoulder >= 120) flag = 1;
  //   }
  // }

  // ------------------------------------ DUMBELL -----------------------------------------
  if (poses.length > 0) {
    pose = poses[0].pose;

    if (pose.keypoints.length >= 9) {
      let shoulder = [
        pose.keypoints[5].position.x,
        pose.keypoints[5].position.y,
      ];
      let elbow = [pose.keypoints[7].position.x, pose.keypoints[7].position.y];
      let wrist = [pose.keypoints[9].position.x, pose.keypoints[9].position.y];

      let angle = find_angle(shoulder, elbow, wrist);
      // console.log(angle);

      if (angle > 2.5) {
        stage = "down";
        // console.log("down");
      }
      if (
        angle < 1 &&
        (stage.localeCompare("") == 0 || stage.localeCompare("down") == 0)
      ) {
        stage = "up";
        counter += 1;
        console.log("up");
        // console.log(counter);
      }
    }
  }
}

function find_angle(A, B, C) {
  var AB = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2));
  var BC = Math.sqrt(Math.pow(B[0] - C[0], 2) + Math.pow(B[1] - C[1], 2));
  var AC = Math.sqrt(Math.pow(C[0] - A[0], 2) + Math.pow(C[1] - A[1], 2));
  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
}

function gotData(data, id) {
  // If it is JSON, parse it
  let d = JSON.parse(data);
  document.getElementById("poseCounterOther").textContent = d;
  console.log(d);
}

function gotStream(stream, id) {
  // This is just like a video/stream from createCapture(VIDEO)
  otherVideo = stream;
  //otherVideo.id and id are the same and unique identifiers
  otherVideo.size(320, 240);
  otherVideo.position(1000, 180);
}
