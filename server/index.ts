import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import billingRoutes from "./routes/billing.js";
import projectRoutes from "./routes/projects.js";
import conversationRoutes from "./routes/conversations.js";
import stagingRoutes from "./routes/staging.js";
import ideRoutes from "./routes/ide.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? process.env.BASE_URL : true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/staging", stagingRoutes);
app.use("/api/ide", ideRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Static / SPA ────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BuilderBlue² server running on port ${PORT}`);
});

export default app;
