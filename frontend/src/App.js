import { useState, useEffect } from "react";

function App() {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([]);
  const [logged, setLogged] = useState(false);

  const login = async () => {
    await fetch("http://localhost:4000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setLogged(true);
    loadPlayers();
  };

  const loadPlayers = async () => {
    const res = await fetch("http://localhost:4000/players");
    const data = await res.json();
    setPlayers(data);
  };

  useEffect(() => {
    if (logged) loadPlayers();
  }, [logged]);

  if (!logged) {
    return (
      <div>
        <h1>Connexion</h1>
        <input
          placeholder="Ton pseudo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={login}>Se connecter</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Joueurs connectés</h1>
      <ul>
        {players.map((p, i) => (
          <li key={i}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
