import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect(err => {
  if (err) {
    console.error("❌ Error al conectar a MySQL:", err);
    return;
  }
  console.log("✅ Conectado a MySQL");
});

// RUTAS CRUD
app.get("/usuarios", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// RObtener usuario por ID
app.get("/usuarios/:id", (req, res) => {
  const sql = "SELECT * FROM usuarios WHERE id = ?";
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(results[0]);
  });
});

app.post("/usuarios", (req, res) => {
  const { nombre, apellido, edad, correo } = req.body;
  db.query(
    "INSERT INTO usuarios (nombre, apellido, edad, correo) VALUES (?, ?, ?, ?)",
    [nombre, apellido, edad, correo],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ id: result.insertId, nombre, apellido, edad, correo });
    }
  );
});

app.put("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, edad, correo } = req.body;
  db.query(
    "UPDATE usuarios SET nombre=?, apellido=?, edad=?, correo=? WHERE id=?",
    [nombre, apellido, edad, correo, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ id, nombre, apellido, edad, correo });
    }
  );
});

app.delete("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM usuarios WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: `Usuario ${id} eliminado` });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
