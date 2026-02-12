const express = require("express");
const session = require("express-session");


const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));


app.post("/login", (req, res) => {
  const { username, password } = req.body;


  if (username === "admin" && password === "1234") {
    req.session.user = username;
    res.redirect("/dashboard.html");
  } else {
    res.send("Wrong credentials");
  }
});


app.listen(3000, () => {
  console.log("Running on http://localhost:3000/login.html");
});


