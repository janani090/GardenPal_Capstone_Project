async function loadSensorData() {
  try {
    const response = await fetch("/api/sensor-data");
    const data = await response.json();

    const moistureEl = document.getElementById("plant1-moisture");
    const sunlightEl = document.getElementById("plant1-sunlight");
    const updateEl = document.getElementById("last-update");

    if (moistureEl) {
      moistureEl.textContent = `Moisture: ${Math.round(data.soil_percentage)}%`;
    }

    if (sunlightEl) {
      sunlightEl.textContent = `Sunlight: ${data.light_lux} lux`;
    }

    if (updateEl) {
      updateEl.textContent = `Last updated: ${data.timestamp}`;
    }
  } catch (error) {
    console.error("Failed to load sensor data:", error);
  }
}

loadSensorData();
setInterval(loadSensorData, 5000);