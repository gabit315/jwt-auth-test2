import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// URL существующего JWT сервиса (можно задать через переменные окружения)
const JWT_SERVICE_URL = process.env.JWT_SERVICE_URL || "http://jwt-service:4000";

// Фейковая база пользователей
const USERS = [
  { id: 1, username: "admin", password: "123", roles: ["admin"] },
  { id: 2, username: "user", password: "456", roles: ["user"] }
];

// POST /login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  try {
    const jwtRes = await fetch(`${JWT_SERVICE_URL}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sub: user.id,
        roles: user.roles
      })
    });

    const data = await jwtRes.json();
    res.json(data);
  } catch (err) {
    console.error("JWT Service error:", err);
    res.status(500).json({ error: "JWT Service unavailable" });
  }
});

// POST /refresh
app.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const jwtRes = await fetch(`${JWT_SERVICE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token })
    });

    const data = await jwtRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "JWT Service unavailable" });
  }
});

// POST /logout
app.post("/logout", async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const jwtRes = await fetch(`${JWT_SERVICE_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token })
    });

    const data = await jwtRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "JWT Service unavailable" });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
