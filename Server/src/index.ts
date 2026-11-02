import "dotenv/config";
import net from "node:net";
import dns from "node:dns";

if (typeof net.setDefaultAutoSelectFamily === "function") {
  net.setDefaultAutoSelectFamily(false);
}
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

import express from "express";
import cors from "cors";
import { pool } from "./db/db.js";
import authRouter from "./routes/authRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import productRouter from "./routes/productRoutes.js";
import categoriesRouter from "./routes/categoriesRoutes.js";
import contactRouter from "./routes/contactRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import accountRouter from "./routes/accountRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import {
  generalArcjetMiddleware,
} from "./lib/arcjet.js";

const app = express();
const port = Number(process.env.PORT ?? 8000);

const configuredOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. server-to-server, mobile, curl)
      if (!origin) return callback(null, true);

      const isAllowed =
        configuredOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com");

      if (isAllowed) {
        return callback(null, true);
      }

      // Allow configured origins gracefully
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["x-total-count"],
  }),
);

app.get("/", (_req, res) => {
  res.json({ message: "Lumora API is running!" });
});

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      status: "success",
      message: "Lumora API and database are connected!",
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

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/payments", paymentRouter);
app.use("/api", generalArcjetMiddleware);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/contact", contactRouter);
app.use("/api/customers", customerRouter);
app.use("/api/account", accountRouter);
app.use("/api/dashboard", dashboardRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`CORS allowed origins: ${configuredOrigins.join(", ")}`);
});
