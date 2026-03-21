import express from "express";
import session from "express-session";
import fs from "fs";

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

app.listen(3000, () => {
  console.log("Running on http://localhost:3000/login.html");
});


