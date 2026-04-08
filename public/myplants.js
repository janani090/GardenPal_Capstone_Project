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

const defaultPlant = {
  timestamp: "Manual default",
  soil_percentage: 60,
  light_lux: 300
};

async function loadSensorData() {
  try {
    const response = await fetch("/api/sensor-data");
    const data = await response.json();

    if (!data.plants) {
      console.error("No plants object found in JSON.");
      return;
    }

    // Now plant1/plant2 are objects, not arrays
    const plant1Latest = data.plants.plant1;
    const plant2Latest = data.plants.plant2;
    const plant3Latest = data.plants.plant3;

    // ---------------- PLANT 1 ----------------
    if (plant1Latest && plant1Latest.timestamp) {
      const lux1 = plant1Latest.light_lux;
      const percent1 = luxToPercent(lux1);
      const category1 = luxToCategory(lux1);

      document.getElementById("plant1-moisture").textContent =
        `Moisture: ${Math.round(plant1Latest.soil_percentage)}%`;

      document.getElementById("plant1-sunlight").textContent =
        `Sunlight: ${category1} (${percent1}%)`;

      const plant1Update = document.getElementById("plant1-update");
      if (plant1Update) {
        plant1Update.textContent = `Last updated: ${plant1Latest.timestamp}`;
      }

      // Sidebar update (last update section)
      const lastUpdate = document.getElementById("last-update");
      if (lastUpdate) {
        lastUpdate.textContent = `Last update: ${plant1Latest.timestamp}`;
      }
    }

    // ---------------- PLANT 2 ----------------
    if (plant2Latest && plant2Latest.timestamp) {
      const lux2 = plant2Latest.light_lux;
      const percent2 = luxToPercent(lux2);
      const category2 = luxToCategory(lux2);

      document.getElementById("plant2-moisture").textContent =
        `Moisture: ${Math.round(plant2Latest.soil_percentage)}%`;

      document.getElementById("plant2-sunlight").textContent =
        `Sunlight: ${category2} (${percent2}%)`;

      const plant2Update = document.getElementById("plant2-update");
      if (plant2Update) {
        plant2Update.textContent = `Last updated: ${plant2Latest.timestamp}`;
      }
    }

    const luxDefault = defaultPlant.light_lux;
    const percentDefault = luxToPercent(luxDefault);
    const categoryDefault = luxToCategory(luxDefault);

    // Plant 3
    document.getElementById("plant3-moisture").textContent =
      `Moisture: ${Math.round(defaultPlant.soil_percentage)}%`;

    document.getElementById("plant3-sunlight").textContent =
      `Sunlight: ${categoryDefault} (${percentDefault}%)`;

    // Plant 4
    document.getElementById("plant4-moisture").textContent =
      `Moisture: ${Math.round(defaultPlant.soil_percentage)}%`;

    document.getElementById("plant4-sunlight").textContent =
      `Sunlight: ${categoryDefault} (${percentDefault}%)`;

    // Plant 5
    document.getElementById("plant5-moisture").textContent =
      `Moisture: ${Math.round(defaultPlant.soil_percentage)}%`;

    document.getElementById("plant5-sunlight").textContent =
      `Sunlight: ${categoryDefault} (${percentDefault}%)`;

    // Plant 6
    document.getElementById("plant6-moisture").textContent =
      `Moisture: ${Math.round(defaultPlant.soil_percentage)}%`;

    document.getElementById("plant6-sunlight").textContent =
      `Sunlight: ${categoryDefault} (${percentDefault}%)`;

      } catch (error) {
        console.error("Failed to load sensor data:", error);
      }
    }

document.addEventListener("DOMContentLoaded", () => {
  loadSensorData();
  setInterval(loadSensorData, 5000);
});