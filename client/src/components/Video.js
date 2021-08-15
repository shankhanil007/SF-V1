import { useState, useEffect } from "react";
import axios from "axios";

function Video() {
  const getHrData = async () => {
    const data = await axios({
      method: "GET",
      url: `http://localhost:5000/api/render`,
    });
  };

  useEffect(() => {
    getHrData();
  }, []);
  return <div>Hello</div>;
}

export default Video;
