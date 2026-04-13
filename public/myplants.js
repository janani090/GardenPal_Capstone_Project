function luxToPercent(lux) {
  const maxLux = 10000;
  return Math.min(100, Math.round((lux / maxLux) * 100));
}

function luxToCategory(lux) {
  if (lux < 200) return "Low";
  if (lux < 1000) return "Medium";
  if (lux < 5000) return "Bright";
  return "Direct Sun";
}

// Prevent spamming AI calls
let lastTimestamps = {};

// Default plant list (only first 2 are real sensors)
const defaultPlants = [
  { id: "plant1", name: "Hydrangea", sensorKey: "plant1" },
  { id: "plant2", name: "Dandelion", sensorKey: "plant2" }
];

// Load saved plants from localStorage (or use defaults)
function loadPlantList() {
  const saved = localStorage.getItem("plants");

  if (saved) {
    return JSON.parse(saved);
  }

  localStorage.setItem("plants", JSON.stringify(defaultPlants));
  return defaultPlants;
}

// Save updated list
function savePlantList(plants) {
  localStorage.setItem("plants", JSON.stringify(plants));
}

async function analyzePlantWithAI(plantObj, plantType) {
  try {
    const lux = plantObj.light_lux;
    const sunlightHoursEstimate = Math.round((luxToPercent(lux) / 100) * 10);

    const requestBody = {
      type: plantType,
      moisture: Math.round(plantObj.soil_percentage),
      sunlight: sunlightHoursEstimate,
      temperature: plantObj.temperature_F,
      humidity: plantObj["humidity_%"]
    };

    const response = await fetch("/api/analyze-plant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    return await response.json();
  } catch (error) {
    console.error("AI analysis failed:", error);
    return { status: "unknown" };
  }
}

function updatePlantCardStatus(cardElement, aiStatus) {
  if (!cardElement) return;

  cardElement.classList.remove("healthy", "need-water", "at-risk");

  const statusSpan = cardElement.querySelector(".status");

  if (aiStatus === "healthy") {
    cardElement.classList.add("healthy");
    if (statusSpan) statusSpan.textContent = "Healthy";
  } else if (aiStatus === "needs-water") {
    cardElement.classList.add("need-water");
    if (statusSpan) statusSpan.textContent = "Needs Watering";
  } else if (aiStatus === "at-risk") {
    cardElement.classList.add("at-risk");
    if (statusSpan) statusSpan.textContent = "At Risk";
  } else {
    cardElement.classList.add("at-risk");
    if (statusSpan) statusSpan.textContent = "At Risk";
  }
}

function updateSidebarCounts() {
  const cards = document.querySelectorAll(".plant-grid .plant-card");

  let healthyCount = 0;
  let needWaterCount = 0;
  let atRiskCount = 0;

  cards.forEach(card => {
    if (card.classList.contains("healthy")) healthyCount++;
    else if (card.classList.contains("need-water")) needWaterCount++;
    else if (card.classList.contains("at-risk")) atRiskCount++;
  });

  const healthyEl = document.querySelector(".health-summary .healthy");
  const needWaterEl = document.querySelector(".health-summary .need-water");
  const atRiskEl = document.querySelector(".health-summary .at-risk");

  if (healthyEl) healthyEl.textContent = `${healthyCount} Healthy`;
  if (needWaterEl) needWaterEl.textContent = `${needWaterCount} Need Water`;
  if (atRiskEl) atRiskEl.textContent = `${atRiskCount} At Risk`;
}

function createPlantCard(plant) {
  const card = document.createElement("div");
  card.classList.add("plant-card", "at-risk");
  card.dataset.plantId = plant.id;

  card.innerHTML = `
    <h3>${plant.name}</h3>
    <p id="${plant.id}-sunlight">Sunlight: --</p>
    <p id="${plant.id}-moisture">Moisture: --</p>
    <span class="status">Loading...</span>
  `;

  return card;
}

function updatePlantCount() {
  const plantCards = document.querySelectorAll("#plant-grid .plant-card");
  const count = plantCards.length;

  const plantCountEl = document.getElementById("plant-count");
  if (plantCountEl) {
    plantCountEl.textContent = `Plant Count: ${count}`;
  }
}

function renderPlants() {
  const grid = document.getElementById("plant-grid");
  grid.innerHTML = "";

  const plants = loadPlantList();

  plants.forEach(plant => {
    const card = createPlantCard(plant);
    grid.appendChild(card);
  });

  updatePlantCount();
  updateSidebarCounts();
}

async function loadSensorData() {
  try {
    const response = await fetch("/api/sensor-data");
    const data = await response.json();

    if (!data.plants) {
      console.error("No plants object found in JSON.");
      return;
    }

    const plants = loadPlantList();

    for (let plant of plants) {
      const sensorKey = plant.sensorKey;
      const sensorData = data.plants[sensorKey];

      const moistureEl = document.getElementById(`${plant.id}-moisture`);
      const sunlightEl = document.getElementById(`${plant.id}-sunlight`);
      const cardEl = document.querySelector(`[data-plant-id="${plant.id}"]`);

      // If this plant has NO sensor data
      if (!sensorData) {
        if (moistureEl) moistureEl.textContent = "Moisture: No sensor connected";
        if (sunlightEl) sunlightEl.textContent = "Sunlight: No sensor connected";

        if (cardEl) {
          cardEl.classList.remove("healthy", "need-water", "at-risk");
          cardEl.classList.add("at-risk");
          cardEl.querySelector(".status").textContent = "No Sensor";
        }

        continue;
      }

      const lux = sensorData.light_lux;
      const percent = luxToPercent(lux);
      const category = luxToCategory(lux);

      if (moistureEl) {
        moistureEl.textContent = `Moisture: ${Math.round(sensorData.soil_percentage)}%`;
      }

      if (sunlightEl) {
        sunlightEl.textContent = `Sunlight: ${category} (${percent}%)`;
      }

      // Update last sensor update time (use latest from plant1 or any plant)
      const lastUpdate = document.getElementById("last-update");
      if (lastUpdate && sensorData.timestamp) {
        lastUpdate.textContent = `Last update: ${sensorData.timestamp}`;
      }

      // AI status check (only when timestamp changes)
      if (sensorData.timestamp && sensorData.timestamp !== lastTimestamps[plant.id]) {
        lastTimestamps[plant.id] = sensorData.timestamp;

        const ai = await analyzePlantWithAI(sensorData, plant.name);
        updatePlantCardStatus(cardEl, ai.status);
      }
    }

    updateSidebarCounts();

  } catch (error) {
    console.error("Failed to load sensor data:", error);
  }
}

function setupAddPlantButton() {
  const btn = document.getElementById("addPlantBtn");

  btn.addEventListener("click", () => {
    const plantName = prompt("Enter your plant name:");

    if (!plantName || plantName.trim() === "") return;

    const plants = loadPlantList();

    const newPlantId = `plant${plants.length + 1}`;

    plants.push({
      id: newPlantId,
      name: plantName.trim(),
      sensorKey: null 
    });

    savePlantList(plants);
    renderPlants();
    loadSensorData();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderPlants();
  setupAddPlantButton();

  loadSensorData();
  setInterval(loadSensorData, 5000);
});