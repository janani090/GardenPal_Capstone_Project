function luxToPercent(lux) {
  const maxLux = 10000; // we can adjust this based on what maximum value should be
  return Math.min(100, Math.round((lux / maxLux) * 100));
}

function luxToCategory(lux) {
  if (lux < 200) return "Low";
  if (lux < 1000) return "Medium";
  if (lux < 5000) return "Bright";
  return "Direct Sun";
}

async function loadSensorData() {
  try {
    const response = await fetch("/api/sensor-data");
    const data = await response.json();

    const plantCount = Object.values(data.plants).filter(readings => {
      const latest = readings[readings.length - 1];
      return latest.timestamp !== "Manual default" && latest.timestamp !== 0;
    }).length;

    console.log("Plants being sensed:", plantCount);

    const plant1Latest = data.plants.plant1[data.plants.plant1.length - 1];
    const plant2Latest = data.plants.plant2[data.plants.plant2.length - 1];

    // plant 3 - default plant
    const plant3Latest = {
      timestamp: "Manual default",
      soil_percentage: 60,
      light_lux: 300
    };
    
    // plant 1

    const lux1 = plant1Latest.light_lux;
    const percent1 = luxToPercent(lux1);
    const category1 = luxToCategory(lux1);

    document.getElementById("plant1-moisture").textContent =
      `Moisture: ${Math.round(plant1Latest.soil_percentage)}%`;

    document.getElementById("plant1-sunlight").textContent =
      `Sunlight: ${category1} (${percent1}%)`;

    document.getElementById("plant1-update").textContent =
      `Last updated: ${plant1Latest.timestamp}`;

    // plant 2

    const lux2 = plant2Latest.light_lux;
    const percent2 = luxToPercent(lux2);
    const category2 = luxToCategory(lux2);

    document.getElementById("plant2-moisture").textContent =
      `Moisture: ${Math.round(plant2Latest.soil_percentage)}%`;

    document.getElementById("plant2-sunlight").textContent =
      `Sunlight: ${category2} (${percent2}%)`;

    document.getElementById("plant2-update").textContent =
      `Last updated: ${plant2Latest.timestamp}`;

    // plant 3

    const lux3 = plant3Latest.light_lux;
    const percent3 = luxToPercent(lux3);
    const category3 = luxToCategory(lux3);

    document.getElementById("plant3-moisture").textContent =
      `Moisture: ${plant3Latest.soil_percentage}%`;

    document.getElementById("plant3-sunlight").textContent =
      `Sunlight: ${category3} (${percent3}%)`;

    document.getElementById("plant3-update").textContent =
      `Last updated: ${plant3Latest.timestamp}`;
  } catch (error) {
    console.error("Failed to load sensor data:", error);
  }
}

loadSensorData();
setInterval(loadSensorData, 5000);