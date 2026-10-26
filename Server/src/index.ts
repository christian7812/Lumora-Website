import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { pool } from "./db/db.js";

const app = express();
const port = Number(process.env.PORT ?? 5000);

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.all(["/api/auth", "/api/auth/*splat"], toNodeHandler(auth));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Cruiser Store API is running!" });
});

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      status: "success",
      message: "Cruiser Store API and database are connected!",
      databaseTime: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      status: "error",
      message: "The API is running, but the database connection failed.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
});
