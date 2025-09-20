import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createPool } from "mysql2/promise";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Pool MySQL
const pool = createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
});

// Helper: invocar SP
async function spCrudVehiculos({
  id = null,
  id_marca = null,
  id_modelo = null,
  anio = null,
  chasis = null,
  motor = null,
  nombre = null,
  activo = null,
  accion // 'C' | 'U' | 'D' | 'R'
}) {
  const sql = "CALL sp_crud_vehiculos(?,?,?,?,?,?,?,?,?)";
  const params = [id, id_marca, id_modelo, anio, chasis, motor, nombre, activo, accion];
  const [rows] = await pool.query(sql, params);
  // Los SELECT del SP vienen en rows[0]
  return Array.isArray(rows) ? rows[0] : rows;
}

// Health
app.get("/health", async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/** Crear vehículo -> ACCION = 'C'
 * Body requerido: { id_marca, id_modelo, anio, chasis, motor, nombre, activo }
 */
app.post("/vehiculos", async (req, res) => {
  try {
    const { id_marca, id_modelo, anio, chasis, motor, nombre, activo = 1 } = req.body ?? {};
    // id = null para insertar (según tu ejemplo)
    const data = await spCrudVehiculos({
      id: null,
      id_marca,
      id_modelo,
      anio,
      chasis,
      motor,
      nombre,
      activo,
      accion: "C"
    });
    res.status(201).json({ message: "Vehículo creado", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear vehículo", error: String(err) });
  }
});

/** Actualizar vehículo -> ACCION = 'U'
 * Body aceptado: { id_marca, id_modelo, anio, chasis, motor, nombre, activo }
 */
app.put("/vehiculos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { id_marca, id_modelo, anio, chasis, motor, nombre, activo = 1 } = req.body ?? {};
    const data = await spCrudVehiculos({
      id,
      id_marca,
      id_modelo,
      anio,
      chasis,
      motor,
      nombre,
      activo,
      accion: "U"
    });
    res.json({ message: `Vehículo ${id} actualizado`, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar vehículo", error: String(err) });
  }
});

/** Eliminar vehículo (lógico o según maneje tu SP) -> ACCION = 'D'
 * Solo requiere :id en la ruta.
 */
app.delete("/vehiculos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await spCrudVehiculos({
      id,
      id_marca: null,
      id_modelo: null,
      anio: null,
      chasis: null,
      motor: null,
      nombre: null,
      activo: null,
      accion: "D"
    });
    res.json({ message: `Vehículo ${id} eliminado`, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al eliminar vehículo", error: String(err) });
  }
});

/** Buscar por ID -> ACCION = 'R'
 * Devuelve el registro que el SP retorne con SELECT
 */
app.get("/vehiculos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await spCrudVehiculos({
      id,
      id_marca: null,
      id_modelo: null,
      anio: null,
      chasis: null,
      motor: null,
      nombre: null,
      activo: null,
      accion: "R"
    });
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al consultar vehículo", error: String(err) });
  }
});

// 404
app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

// Start
app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`);
});
