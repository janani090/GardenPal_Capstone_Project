const PI_CAMERA_URL = "http://PI_IP:8000/stream.mjpg";

const feedImage = document.getElementById("feedImage");
const cameraStatus = document.getElementById("cameraStatus");

feedImage.src = PI_CAMERA_URL;

feedImage.onload = () => {
  cameraStatus.textContent = "Camera is live";
};

feedImage.onerror = () => {
  cameraStatus.textContent = "Unable to connect to camera feed";
};