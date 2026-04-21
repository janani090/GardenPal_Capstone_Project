import express from "express";
import session from "express-session";
import fs from "fs";
import dotenv from "dotenv";
import {analyzePlant} from "./ai-test/analyzePlant.js";
import http from 'http';

dotenv.config();

const data = JSON.parse(fs.readFileSync("users.json"));
const users = data.users;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));


app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));


app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);

  if (user && user.password === password) {
    req.session.user = user;
    res.redirect("/live-feed.html");
  } else {
    res.redirect("/login.html?error=1");
  }
});

app.get("/api/user-data", (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Not logged in");
  }

  res.json(req.session.user);
});

app.get("/api/sensor-data", (req, res) => {
  try {
    const sensorData = JSON.parse(fs.readFileSync("testing_data.json", "utf8"));
    res.json(sensorData);
  } catch (error) {
    res.status(500).json({ error: "Sensor data not available" });
  }
});

app.post("/api/update-sensor-data", (req, res) => {
  try {
    fs.writeFileSync("testing_data.json", JSON.stringify(req.body, null, 2));
    res.json({ message: "Sensor data updated successfully"});
  } catch (error) {
    res.status(500).json({ error: "Failed to update sensor data"});
  }
});

app.get('/camera-stream', (req, res) => {
  http.get('http://127.0.0.1:8000/stream.mjpg', (streamRes) => {
    res.writeHead(200, {
      'Content-Type': streamRes.headers['content-type'] || 'multipart/x-mixed-replace; boundary=FRAME',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    streamRes.pipe(res);
  }).on('error', (err) => {
    console.error('Camera stream error:', err.message);
    res.status(500).send('Camera stream unavailable');
  });
});

app.use(express.json());

app.post("/api/analyze-plant", async (req, res) => {
  try {
    const plantData = req.body;

    const result = await analyzePlant(plantData);

    res.json(result);
  } catch (err) {
    console.error("Analyze plant route error:", err);
    res.status(500).json({
      status: "unknown",
      reason: "Server error",
      action: "Try again later",
      confidence: 0
    });
  }
});

app.post("/ai-weather", async (req, res) => {
  try {
    const today_json = req.body;

    if (!today_json || !today_json[0]) {
      return res.status(400).json({ error: "Invalid input format" });
    }

    const prompt = `You are a weather and horticulture expert. Analyze the weather below.
Temperature: ${today_json[0].temperature}
Precipitation: ${today_json[0].probabilityOfPrecipitation?.value ?? "N/A"}%
Wind Speed: ${today_json[0].windSpeed}
Detailed Forecast: ${today_json[0].detailedForecast}

Return a JSON in the format:
{"ai_message":"one to two sentences on how the weather may affect plants today and what a homeowner should know."}

Do not return anything except valid JSON.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a plant and weather expert." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Groq bad response:", data);
      return res.status(500).json({ error: "AI response missing" });
    }

    const ai_response = data.choices[0].message.content;
    res.json({ ai_response });

  } catch (error) {
    console.error("AI weather route error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.listen(3000, () => {
  console.log("Running on http://localhost:3000/login.html");
});
