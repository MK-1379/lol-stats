import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});