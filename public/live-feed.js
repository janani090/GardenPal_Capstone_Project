const PI_CAMERA_URL = "/camera-stream";

const feedImage = document.getElementById("feedImage");
const cameraStatus = document.getElementById("cameraStatus");

feedImage.src = PI_CAMERA_URL;

feedImage.onload = () => {
  cameraStatus.textContent = "Camera is live";
};

feedImage.onerror = () => {
  cameraStatus.textContent = "Unable to connect to camera feed";
};
// hold data to use it later for notifs
let lastPredatorTimestamp = null;
let cachedAIAlerts = [];
let animalAlerts = [];

// icons for status alerts
function getAlertIcon(status) {
  if (status === "needs-water") return "💧";
  if (status === "at-risk") return "⚠️";
  if (status === "healthy") return "🌱";
  return "❓";
}
// icons for predator alerts
function getPredatorIcon(type) {
  if (type === "rabbit") return "🐇";
  if (type === "deer") return "🦌";
  if (type === "squirrel") return "🐿️";
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

async function loadPredatorAlerts() {
  try {
    const response = await fetch("/api/sensor-data");
    const data = await response.json();

    const plants = JSON.parse(localStorage.getItem("plants")) || [];

    if (data.predator && data.predator.predatorTrue === true) {
      const predatorType = data.predator.type || "Unknown Predator";
      const predatorTimestamp = data.predator.timestamp || "Unknown time";
      const plantKey = data.predator.plantKey;

      let plantName = "Unknown Plant";
      if (plantKey) {
        const match = plants.find(p => p.sensorKey === plantKey);
        if (match) plantName = match.name;
      }

      const alreadyExists = animalAlerts.some(alert =>
        alert.timestamp === predatorTimestamp &&
        alert.type === predatorType &&
        alert.plantName === plantName
      );

      if (!alreadyExists) {
        animalAlerts.unshift({
          icon: getPredatorIcon(predatorType),
          title: `Predator Detected`,
          message: `A ${predatorType} was detected near ${plantName}.`,
          timestamp: predatorTimestamp,
          type: predatorType,
          plantName: plantName
        });
      }
    }

    renderAlerts([...animalAlerts, ...cachedAIAlerts]);

  } catch (err) {
    console.error("Failed to load predator alerts:", err);
  }
}

async function loadPlantAlerts() {
  try {
    const response = await fetch("/api/sensor-data");
    const data = await response.json();

    if (!data.plants) return;

    const plants = JSON.parse(localStorage.getItem("plants")) || [];

    const aiPromises = plants.map(async (plant) => {
      if (!plant.sensorKey) return null;

      const sensorData = data.plants[plant.sensorKey];
      if (!sensorData) return null;

      const ai = await analyzePlantWithAI(sensorData, plant.name);
      if (!ai) return null;

      if (ai.status !== "healthy") {
        return {
          icon: getAlertIcon(ai.status),
          title: `${getAlertTitle(ai.status)} (${plant.name})`,
          message: ai.action || ai.reason || "No recommended action available.",
          plantName: plant.name
        };
      }

      return null;
    });

    const aiAlerts = (await Promise.all(aiPromises)).filter(a => a !== null);
    cachedAIAlerts = aiAlerts;
    renderAlerts([...animalAlerts, ...cachedAIAlerts]);

  } catch (err) {
    console.error("Failed to load AI alerts:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPredatorAlerts();
  loadPlantAlerts();

  setInterval(loadPredatorAlerts, 5000);
  setInterval(loadPlantAlerts, 60000);

});