const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Base SQLite
const db = new sqlite3.Database("./players.db");

// Création de la table
db.run(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
`);

// Ajouter un joueur
app.post("/login", (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO players (name) VALUES (?)", [name], () => {
    res.sendStatus(200);
  });
});

// Récupérer les joueurs
app.get("/players", (req, res) => {
  db.all("SELECT name FROM players", (err, rows) => {
    res.json(rows);
  });
});

app.listen(4000, () => {
  console.log("Backend lancé sur http://localhost:4000");
});
