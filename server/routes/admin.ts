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
  group: string;
  placeholder: string;
  required: boolean;
}

const MANAGED_KEYS: ManagedKey[] = [
  { key: "DATABASE_URL", label: "Database URL", group: "Database", placeholder: "postgresql://user:password@host:5432/builderblue2", required: true },
  { key: "ACCESS_TOKEN_SECRET", label: "Access Token Secret", group: "Authentication", placeholder: "64+ character random string", required: true },
  { key: "REFRESH_TOKEN_SECRET", label: "Refresh Token Secret", group: "Authentication", placeholder: "64+ character random string", required: true },
  { key: "OWNER_EMAIL", label: "Owner Email", group: "Authentication", placeholder: "dean@triadblue.com", required: true },
  { key: "BASE_URL", label: "Base URL", group: "Application", placeholder: "https://builderblue2.com", required: true },
  { key: "PORT", label: "Port", group: "Application", placeholder: "5000", required: true },
  { key: "RESEND_API_KEY", label: "Resend API Key", group: "Email", placeholder: "re_xxxxxxxx", required: false },
  { key: "HOSTSBLUE_SSO_SECRET", label: "HostsBlue SSO Secret", group: "SSO", placeholder: "shared HMAC secret", required: false },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic (Claude)", group: "AI Providers", placeholder: "sk-ant-xxxxxxxx", required: true },
  { key: "OPENAI_API_KEY", label: "OpenAI", group: "AI Providers", placeholder: "sk-xxxxxxxx", required: true },
  { key: "DEEPSEEK_API_KEY", label: "DeepSeek", group: "AI Providers", placeholder: "sk-xxxxxxxx", required: true },
  { key: "GEMINI_API_KEY", label: "Google Gemini", group: "AI Providers", placeholder: "AIzaxxxxxxxx", required: true },
  { key: "KIMI_API_KEY", label: "Kimi (Moonshot)", group: "AI Providers", placeholder: "sk-xxxxxxxx", required: true },
  { key: "GROQ_API_KEY", label: "Groq", group: "AI Providers", placeholder: "gsk_xxxxxxxx", required: true },
  { key: "OPENROUTER_API_KEY", label: "OpenRouter", group: "AI Providers", placeholder: "sk-or-xxxxxxxx", required: true },
  { key: "ENCRYPTION_KEY", label: "Encryption Key", group: "Security", placeholder: "32-byte base64 string", required: true },
  { key: "GITHUB_TOKEN", label: "GitHub Token", group: "GitHub", placeholder: "ghp_xxxxxxxx", required: false },
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
  if (value.length <= 4) return "••••";
  return "••••••••" + value.slice(-4);
}

router.get("/platform-keys", authenticate, requireRole("owner"), (_req, res) => {
  try {
    const envVars = parseEnvFile();
    const keys = MANAGED_KEYS.map((mk) => ({
      key: mk.key, label: mk.label, group: mk.group,
      placeholder: mk.placeholder, required: mk.required,
      isSet: Boolean(envVars[mk.key]), maskedValue: maskValue(envVars[mk.key] || ""),
    }));
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
    const managedKeySet = new Set(MANAGED_KEYS.map((mk) => mk.key));
    for (const key of Object.keys(updates)) {
      if (!managedKeySet.has(key)) {
        res.status(400).json({ message: `Unknown key: ${key}` });
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
    const keys = MANAGED_KEYS.map((mk) => ({
      key: mk.key, label: mk.label, group: mk.group,
      placeholder: mk.placeholder, required: mk.required,
      isSet: Boolean(envVars[mk.key]), maskedValue: maskValue(envVars[mk.key] || ""),
    }));
    res.json({ message: "Keys updated", keys });
  } catch (error) {
    console.error("Failed to update platform keys:", error);
    res.status(500).json({ message: "Failed to update configuration" });
  }
});

export default router;
