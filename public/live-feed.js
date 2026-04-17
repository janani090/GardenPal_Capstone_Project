const PI_CAMERA_URL = "http://172.20.10.7:8000/stream.mjpg";

const feedImage = document.getElementById("feedImage");
const cameraStatus = document.getElementById("cameraStatus");

feedImage.src = PI_CAMERA_URL;

feedImage.onload = () => {
  cameraStatus.textContent = "Camera is live";
};

feedImage.onerror = () => {
  cameraStatus.textContent = "Unable to connect to camera feed";
};

function getAlertIcon(status) {
  if (status === "needs-water") return "💧";
  if (status === "at-risk") return "⚠️";
  if (status === "healthy") return "🌱";
  return "❓";
}

function getAlertTitle(status) {
  if (status === "needs-water") return "Water Needed";
  if (status === "at-risk") return "Plant At Risk";
  if (status === "healthy") return "Healthy Update";
  return "Unknown Status";
}

function renderAlerts(alerts) {
  const container = document.getElementById("alerts-container");
  if (!container) return;

  container.innerHTML = "";

  if (alerts.length === 0) {
    container.innerHTML = `<p style="padding: 20px;">No alerts right now</p>`;
    return;
  }

  alerts.forEach(alert => {
    const card = document.createElement("div");
    card.classList.add("alert-card");

    card.innerHTML = `
      <div class="alert-icon">${alert.icon}</div>
      <div class="alert-text">
        <h3>${alert.title}</h3>
        <p>${alert.message}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

async function analyzePlantWithAI(sensorData, plantType) {
  try {
    const requestBody = {
      type: plantType,
      moisture: Math.round(sensorData.soil_percentage),
      sunlight: Math.round((sensorData.light_lux / 10000) * 10), // rough estimate
      temperature: sensorData.temperature_F,
      humidity: sensorData["humidity_%"]
    };

    const response = await fetch("/api/analyze-plant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    return await response.json();
  } catch (err) {
    console.error("AI analyze failed:", err);
    return null;
  }
}

async function loadLiveAlerts() {
  try {
    const response = await fetch("/api/sensor-data");
    const data = await response.json();

    if (!data.plants) return;

    const plants = JSON.parse(localStorage.getItem("plants")) || [];

    let alerts = [];

    for (let plant of plants) {
      if (!plant.sensorKey) continue;

      const sensorData = data.plants[plant.sensorKey];
      if (!sensorData) continue;

      const ai = await analyzePlantWithAI(sensorData, plant.name);
      if (!ai) continue;

      if (ai.status !== "healthy") {
        alerts.push({
          icon: getAlertIcon(ai.status),
          title: `${getAlertTitle(ai.status)} (${plant.name})`,
          message: ai.action || ai.reason || "No recommended action available."
        });
      }
    }

    renderAlerts(alerts);

  } catch (err) {
    console.error("Failed to load live alerts:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadLiveAlerts();
  setInterval(loadLiveAlerts, 5000);
});