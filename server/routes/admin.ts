import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../../.env");

interface ManagedKey {
  key: string;
  label: string;
  description: string;
  group: string;
  placeholder: string;
  required: boolean;
}

const MANAGED_KEYS: ManagedKey[] = [
  { key: "DATABASE_URL", label: "Neon Database Connection", description: "PostgreSQL connection string — your Neon project URL with pooler", group: "Database", placeholder: "postgresql://user:password@host:5432/dbname?sslmode=require", required: true },
  { key: "ACCESS_TOKEN_SECRET", label: "JWT Access Token Secret", description: "Random string used to sign short-lived login tokens (keeps users logged in)", group: "Authentication", placeholder: "64+ character random string", required: true },
  { key: "REFRESH_TOKEN_SECRET", label: "JWT Refresh Token Secret", description: "Random string used to sign refresh tokens (silent re-login on page reload)", group: "Authentication", placeholder: "64+ character random string", required: true },
  { key: "OWNER_EMAIL", label: "Owner Email Address", description: "This email auto-elevates to owner role on login — your admin account", group: "Authentication", placeholder: "dean@triadblue.com", required: true },
  { key: "BASE_URL", label: "Site URL", description: "The public URL where BuilderBlue2 is hosted — used for links in emails and SSO", group: "Application", placeholder: "https://builderblue2.com", required: true },
  { key: "PORT", label: "Server Port", description: "Port the Node.js server listens on — Nginx proxies to this", group: "Application", placeholder: "5000", required: true },
  { key: "RESEND_API_KEY", label: "Resend Email Service", description: "API key from resend.com — used for magic link emails and notifications", group: "Email", placeholder: "re_xxxxxxxx", required: false },
  { key: "HOSTSBLUE_SSO_SECRET", label: "hostsblue.com SSO Secret", description: "Shared HMAC secret for single sign-on between hostsblue.com and BuilderBlue2", group: "SSO", placeholder: "shared HMAC secret", required: false },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic — Claude AI", description: "Powers Claude Opus, Sonnet, Haiku models — the primary AI provider", group: "AI Providers", placeholder: "sk-ant-xxxxxxxx", required: true },
  { key: "OPENAI_API_KEY", label: "OpenAI — GPT Models", description: "Powers GPT-4o, o3-mini, and other OpenAI models", group: "AI Providers", placeholder: "sk-xxxxxxxx", required: true },
  { key: "DEEPSEEK_API_KEY", label: "DeepSeek AI", description: "Powers DeepSeek Chat and DeepSeek Coder models", group: "AI Providers", placeholder: "sk-xxxxxxxx", required: true },
  { key: "GEMINI_API_KEY", label: "Google Gemini AI", description: "Powers Gemini Pro and Gemini Flash models from Google", group: "AI Providers", placeholder: "AIzaxxxxxxxx", required: true },
  { key: "KIMI_API_KEY", label: "Kimi / Moonshot AI", description: "Powers Moonshot v1 models (8K and 32K context)", group: "AI Providers", placeholder: "sk-xxxxxxxx", required: true },
  { key: "GROQ_API_KEY", label: "Groq — Fast Inference", description: "Powers Llama, Qwen, Gemma models at high speed via Groq hardware", group: "AI Providers", placeholder: "gsk_xxxxxxxx", required: true },
  { key: "OPENROUTER_API_KEY", label: "OpenRouter — 300+ Models", description: "Single key for GPT-4o, Gemini, Llama, Mistral, and hundreds more via openrouter.ai", group: "AI Providers", placeholder: "sk-or-xxxxxxxx", required: true },
  { key: "ENCRYPTION_KEY", label: "Data Encryption Key", description: "AES-256-GCM key for encrypting secrets stored in the database", group: "Security", placeholder: "32-byte base64 string", required: true },
  { key: "GITHUB_TOKEN", label: "GitHub Personal Access Token", description: "Used for GitHub repo sync, commits, and pull requests from the IDE", group: "GitHub", placeholder: "ghp_xxxxxxxx", required: false },
];

function parseEnvFile(): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(ENV_PATH)) return result;
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function writeEnvFile(envVars: Record<string, string>): void {
  const lines: string[] = [];
  const grouped = new Map<string, ManagedKey[]>();
  for (const mk of MANAGED_KEYS) {
    if (!grouped.has(mk.group)) grouped.set(mk.group, []);
    grouped.get(mk.group)!.push(mk);
  }
  for (const [group, keys] of grouped) {
    lines.push(`# ${group}`);
    for (const mk of keys) {
      const value = envVars[mk.key] ?? "";
      if (value) {
        const needsQuotes = value.includes(" ") || value.includes("#") || value.includes("=");
        lines.push(`${mk.key}=${needsQuotes ? `"${value}"` : value}`);
      }
    }
    lines.push("");
  }
  const existingVars = parseEnvFile();
  const managedKeySet = new Set(MANAGED_KEYS.map(mk => mk.key));
  const unmanagedKeys = Object.entries(existingVars).filter(([k]) => !managedKeySet.has(k));
  if (unmanagedKeys.length > 0) {
    lines.push("# Other");
    for (const [key, value] of unmanagedKeys) {
      lines.push(`${key}=${value}`);
    }
    lines.push("");
  }
  fs.writeFileSync(ENV_PATH, lines.join("\n"), "utf-8");
}

function maskValue(value: string): string {
  if (!value) return "";
  if (value.length <= 7) return value.slice(0, 3) + "••••";
  return value.slice(0, 3) + "••••••••" + value.slice(-4);
}

router.get("/platform-keys", authenticate, requireRole("owner"), (_req, res) => {
  try {
    const envVars = parseEnvFile();
    const keys = MANAGED_KEYS.map((mk) => ({
      key: mk.key, label: mk.label, description: mk.description, group: mk.group,
      placeholder: mk.placeholder, required: mk.required,
      isSet: Boolean(envVars[mk.key]),
      maskedValue: maskValue(envVars[mk.key] || ""),
      value: envVars[mk.key] || "",
    }));
    // Also include any custom keys not in MANAGED_KEYS
    const managedKeySet = new Set(MANAGED_KEYS.map(mk => mk.key));
    for (const [k, v] of Object.entries(envVars)) {
      if (!managedKeySet.has(k)) {
        keys.push({
          key: k, label: k, description: "Custom key", group: "Custom",
          placeholder: "", required: false,
          isSet: true, maskedValue: maskValue(v), value: v,
        });
      }
    }
    res.json({ keys });
  } catch (error) {
    console.error("Failed to read platform keys:", error);
    res.status(500).json({ message: "Failed to read configuration" });
  }
});

router.patch("/platform-keys", authenticate, requireRole("owner"), (req, res) => {
  try {
    const updates: Record<string, string> = req.body.updates;
    if (!updates || typeof updates !== "object") {
      res.status(400).json({ message: "updates object is required" });
      return;
    }
    // Validate key names — alphanumeric + underscore only
    for (const key of Object.keys(updates)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        res.status(400).json({ message: `Invalid key name: ${key}` });
        return;
      }
    }
    const envVars = parseEnvFile();
    for (const [key, value] of Object.entries(updates)) {
      if (value === "") {
        delete envVars[key];
        delete process.env[key];
      } else {
        envVars[key] = value;
        process.env[key] = value;
      }
    }
    writeEnvFile(envVars);
    const managedKeySet = new Set(MANAGED_KEYS.map(mk => mk.key));
    const keys = MANAGED_KEYS.map((mk) => ({
      key: mk.key, label: mk.label, description: mk.description, group: mk.group,
      placeholder: mk.placeholder, required: mk.required,
      isSet: Boolean(envVars[mk.key]),
      maskedValue: maskValue(envVars[mk.key] || ""),
      value: envVars[mk.key] || "",
    }));
    for (const [k, v] of Object.entries(envVars)) {
      if (!managedKeySet.has(k)) {
        keys.push({
          key: k, label: k, description: "Custom key", group: "Custom",
          placeholder: "", required: false,
          isSet: true, maskedValue: maskValue(v), value: v,
        });
      }
    }
    res.json({ message: "Keys updated", keys });
  } catch (error) {
    console.error("Failed to update platform keys:", error);
    res.status(500).json({ message: "Failed to update configuration" });
  }
});

export default router;
