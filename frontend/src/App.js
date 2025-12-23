import { useState, useEffect } from "react";
//import Lobby from "./Lobby";
//import Quiz from "./Quiz";

function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function App() {
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const [startedAt, setStartedAt] = useState(null);
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [logged, setLogged] = useState(false);

  const [browserId] = useState(() => {
    let id = localStorage.getItem("browserId");
    if (!id) {
      id = generateId();
      localStorage.setItem("browserId", id);
    }
    return id;
  });
  useEffect(() => {
    const autoLogin = async () => {
      if (!browserId) return;
  
      try {
        const res = await fetch(`${backendUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",        // le backend ignorera si browserId existe
            browserId
          })
        });
  
        const data = await res.json();
        if (!res.ok) return;
  
        setPlayerId(data.id);
        setName(data.name);
        setLogged(true);
        loadPlayers();
      } catch (err) {
        console.error("Auto-login échoué", err);
      }
    };
    autoLogin();
  }, [browserId]);
  // Connexion
  const login = async () => {
    if (!name) return alert("Entrez un pseudo !");

    try {
      const res = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, browserId})
      });

      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setPlayerId(data.id);
      setLogged(true);
      loadPlayers();
    } catch (err) {
      console.error("Login failed:", err);
      alert("Impossible de se connecter au serveur");
    }
  };

  // Charger la liste des joueurs
  const loadPlayers = async () => {
    try {
      const res = await fetch(`${backendUrl}/players`);
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Impossible de charger les joueurs:", err);
    }
  };

  // Déconnexion automatique à la fermeture du navigateur
  useEffect(() => {
    const handleUnload = () => {
      if (playerId) {
        navigator.sendBeacon(`${backendUrl}/logout/${playerId}`);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [playerId]);

  // Rafraîchissement automatique toutes les 2 secondes
  useEffect(() => {
    if (logged) {
      const interval = setInterval(loadPlayers, 2000);
      return () => clearInterval(interval);
    }
  }, [logged]);

  // Déconnexion manuelle (optionnel)
  const logout = async () => {
    if (!playerId) return;
    try {
      await fetch(`${backendUrl}/logout/${playerId}`, { method: "DELETE" });
      setLogged(false);
      setPlayerId(null);
      setPlayers([]);
      setName("");
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    }
  };

  // Page de connexion
  if (!logged) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Connexion</h1>
        <input
          placeholder="Ton pseudo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br />
        <button onClick={login} style={{ marginTop: "10px" }}>Se connecter</button>
      </div>
    );
  }

  // Page des joueurs connectés
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Joueurs connectés</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {players.map((p) => (
          <li key={p.id} style={{ margin: "5px 0", border: "1px solid #555", padding: "8px", borderRadius: "5px", width: "200px", marginLeft: "auto", marginRight: "auto" }}>
            {p.name}
          </li>
        ))}
      </ul>
      <button onClick={logout} style={{ marginTop: "20px" }}>Se déconnecter</button>
    </div>
  );
  //if (!startedAt) {
  //  return <Lobby onGameStart={setStartedAt} />;
  //}
  //return <Quiz startedAt={startedAt} />;
}

export default App;
