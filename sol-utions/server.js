// server.js
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import basicAuth from "express-basic-auth";
import cors from "cors";
import { stringify } from "csv-stringify/sync";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static front-end from /public
app.use(express.static(path.join(__dirname, "public")));

// Ensure data directory
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Open (or create) SQLite DB
const dbPath = path.join(dataDir, "requests.db");
const db = new Database(dbPath);

// Create requests table if missing
db.prepare(`
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT,
  email TEXT,
  service TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT
)`).run();

// Helper functions
const insertRequest = db.prepare(`INSERT INTO requests (name, phone, email, service, message, status, created_at) VALUES (@name,@phone,@email,@service,@message,@status,@created_at)`);
const selectAll = db.prepare(`SELECT * FROM requests ORDER BY created_at DESC`);
const selectById = db.prepare(`SELECT * FROM requests WHERE id = ?`);
const updateStatusStmt = db.prepare(`UPDATE requests SET status = ? WHERE id = ?`);
const deleteById = db.prepare(`DELETE FROM requests WHERE id = ?`);

// PUBLIC endpoint: receive booking form
app.post("/book", (req, res) => {
  try {
    const { name, phone, email = "", service = "", message = "" } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "name and phone required" });

    const now = new Date().toISOString();
    const info = {
      name: String(name),
      phone: String(phone),
      email: String(email),
      service: String(service),
      message: String(message),
      status: "pending",
      created_at: now
    };

    const result = insertRequest.run(info);
    const id = result.lastInsertRowid;
    res.json({ ok: true, id });

    // Optionally: send notification e.g. email or webhook here (not implemented).
  } catch (err) {
    console.error("Error /book", err);
    res.status(500).json({ error: "internal" });
  }
});

// Admin basic auth config
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "changeme";
app.use("/admin", basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true,
  realm: "Admin Area"
}));

// Admin UI served at /admin (static file)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Admin API: list requests
app.get("/admin/requests", (req, res) => {
  try {
    const rows = selectAll.all();
    res.json({ ok: true, requests: rows });
  } catch (err) {
    console.error("Error /admin/requests", err);
    res.status(500).json({ ok: false, error: "internal" });
  }
});

// Admin API: update status
app.post("/admin/requests/:id/status", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!id || !status) return res.status(400).json({ ok: false, error: "missing" });
    updateStatusStmt.run(status, id);
    const row = selectById.get(id);
    res.json({ ok: true, request: row });
  } catch (err) {
    console.error("Error update status", err);
    res.status(500).json({ ok: false, error: "internal" });
  }
});

// Admin API: delete request
app.delete("/admin/requests/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "missing id" });
    deleteById.run(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error delete request", err);
    res.status(500).json({ ok: false, error: "internal" });
  }
});

// Admin export CSV
app.get("/admin/export", (req, res) => {
  try {
    const rows = selectAll.all();
    const columns = ["id","name","phone","email","service","message","status","created_at"];
    const csv = stringify(rows, { header: true, columns });
    res.setHeader("Content-Disposition", "attachment; filename=requests.csv");
    res.setHeader("Content-Type", "text/csv");
    res.send(csv);
  } catch (err) {
    console.error("Error export", err);
    res.status(500).json({ ok:false, error:"internal" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin (basic auth)`);
});
