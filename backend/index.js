const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// Base SQLite
// ==========================
const db = new sqlite3.Database("./players.db", (err) => {
  if (err) {
    console.error("Erreur ouverture DB :", err.message);
  } else {
    console.log("Base SQLite ouverte");
  }
});

// ==========================
// Création propre de la table
// ==========================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      browserId TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS game (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      state TEXT NOT NULL,
      startedAt INTEGER
    )
  `);

  // Initialisation de l'état du jeu
  db.run(`
    INSERT OR IGNORE INTO game (id, state)
    VALUES (1, 'waiting')
  `);
});


// ==========================
// (OPTIONNEL) Nettoyage au démarrage
// Décommente si tu veux vider la table
// à chaque reboot du Raspberry
// ==========================
// db.run("DELETE FROM players", () => {
//   console.log("Table players nettoyée au démarrage");
// });

// ==========================
// LOGIN
// ==========================
app.post("/login", (req, res) => {
  const { name, browserId } = req.body;

  if (!browserId) {
    return res.status(400).json({ error: "browserId requis" });
  }

  db.get(
    "SELECT id, name FROM players WHERE browserId = ?",
    [browserId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });

      // Déjà connecté → auto-login
      if (row) {
        return res.json({ id: row.id, name: row.name });
      }

      // Nouveau joueur → name requis
      if (!name) {
        return res.status(400).json({ error: "Nom requis pour un nouveau joueur" });
      }

      db.run(
        "INSERT INTO players (name, browserId) VALUES (?, ?)",
        [name, browserId],
        function (err) {
          if (err) return res.status(500).json({ error: "DB error" });
          res.json({ id: this.lastID, name });
        }
      );
    }
  );
});


// ==========================
// LOGOUT
// ==========================
app.delete("/logout/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM players WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Erreur DELETE :", err);
      return res.sendStatus(500);
    }
    console.log(`Joueur déconnecté ID ${id}`);
    res.sendStatus(200);
  });
});

// ==========================
// LISTE DES JOUEURS
// ==========================
app.get("/players", (req, res) => {
  db.all("SELECT id, name FROM players", (err, rows) => {
    if (err) {
      console.error("Erreur SELECT :", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(rows);
  });
});

app.get("/game", (req, res) => {
  db.get("SELECT state, startedAt FROM game WHERE id = 1", (err, row) => {
    if (err) {
      console.error("Erreur GAME GET :", err);
      return res.sendStatus(500);
    }
    res.json({"toto": "tata"});
  });
});

app.post("/game/start", (req, res) => {
  const startedAt = Date.now();

  db.run(
    "UPDATE game SET state = 'started', startedAt = ? WHERE id = 1",
    [startedAt],
    (err) => {
      if (err) {
        console.error("Erreur GAME START :", err);
        return res.sendStatus(500);
      }
      console.log("Jeu lancé");
      res.sendStatus(200);
    }
  );
});

app.post("/game/reset", (req, res) => {
  db.run(
    "UPDATE game SET state = 'waiting', startedAt = NULL WHERE id = 1",
    (err) => {
      if (err) {
        console.error("Erreur GAME RESET :", err);
        return res.sendStatus(500);
      }
      console.log("Jeu réinitialisé");
      res.sendStatus(200);
    }
  );
});

// ==========================
// RESET COMPLET (optionnel)
// ==========================
app.post("/reset", (req, res) => {
  db.run("DELETE FROM players", (err) => {
    if (err) {
      console.error("Erreur RESET :", err);
      return res.sendStatus(500);
    }
    console.log("Table players vidée manuellement");
    res.sendStatus(200);
  });
});

// ==========================
// Démarrage serveur
// ==========================
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend lancé sur le port ${PORT}`);
});
