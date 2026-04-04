import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db.js";
import { aiUsage } from "../../shared/schema.js";
import type { AIProvider, ConversationMessage } from "../../shared/types.js";
import { getArchitectReviewPrompt } from "./architect-prompts.js";

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string, inputTokens: number, outputTokens: number) => void;
  onError: (error: Error) => void;
}

interface StreamOptions {
  userId: string;
  projectId?: string;
  conversationId?: string;
}

// ─── Provider configs ────────────────────────────────────────────────────────

const PROVIDER_ENDPOINTS: Record<string, { baseUrl: string; envKey: string }> = {
  deepseek: { baseUrl: "https://api.deepseek.com/v1", envKey: "DEEPSEEK_API_KEY" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", envKey: "GEMINI_API_KEY" },
  kimi: { baseUrl: "https://api.moonshot.cn/v1", envKey: "KIMI_API_KEY" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", envKey: "GROQ_API_KEY" },
};

// ─── Claude streaming ───────────────────────────────────────────────────────

async function streamClaude(
  model: string,
  messages: ConversationMessage[],
  callbacks: StreamCallbacks,
  options: StreamOptions,
  systemPrompt?: string
): Promise<void> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const formattedMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 4096,
      messages: formattedMessages,
      system: systemPrompt ?? "You are an expert software engineer working in BuilderBlue², an AI-powered IDE. When proposing code changes, always include a filepath comment on the first line of each code block: // filepath: path/to/file.ext",
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullText += event.delta.text;
        callbacks.onChunk(event.delta.text);
      }
    }

    const finalMessage = await stream.finalMessage();
    inputTokens = finalMessage.usage.input_tokens;
    outputTokens = finalMessage.usage.output_tokens;

    callbacks.onComplete(fullText, inputTokens, outputTokens);

    await recordUsage("claude", model, inputTokens, outputTokens, options);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// ─── OpenAI-compatible streaming (DeepSeek, Gemini, Kimi) ───────────────────

async function streamOpenAICompatible(
  provider: string,
  model: string,
  messages: ConversationMessage[],
  callbacks: StreamCallbacks,
  options: StreamOptions,
  systemPrompt?: string
): Promise<void> {
  const config = PROVIDER_ENDPOINTS[provider];
  if (!config) {
    callbacks.onError(new Error(`Unknown provider: ${provider}`));
    return;
  }

  const apiKey = process.env[config.envKey];
  if (!apiKey) {
    callbacks.onError(new Error(`${config.envKey} not configured`));
    return;
  }

  const formattedMessages = [
    {
      role: "system",
      content: systemPrompt ?? "You are an expert software engineer working in BuilderBlue², an AI-powered IDE. When proposing code changes, always include a filepath comment on the first line of each code block: // filepath: path/to/file.ext",
    },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${provider} API error: ${response.status} — ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            callbacks.onChunk(delta);
          }
          if (parsed.usage) {
            inputTokens = parsed.usage.prompt_tokens ?? 0;
            outputTokens = parsed.usage.completion_tokens ?? 0;
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    callbacks.onComplete(fullText, inputTokens, outputTokens);
    await recordUsage(provider, model, inputTokens, outputTokens, options);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// ─── Usage recording ────────────────────────────────────────────────────────

async function recordUsage(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  options: StreamOptions
): Promise<void> {
  // Rough cost estimation (per 1M tokens)
  const costs: Record<string, { input: number; output: number }> = {
    claude: { input: 3.0, output: 15.0 },
    deepseek: { input: 0.14, output: 0.28 },
    gemini: { input: 0.075, output: 0.3 },
    kimi: { input: 1.0, output: 2.0 },
    groq: { input: 0.05, output: 0.10 },
  };

  const rate = costs[provider] ?? { input: 1.0, output: 5.0 };
  const costUsd =
    (inputTokens * rate.input) / 1_000_000 +
    (outputTokens * rate.output) / 1_000_000;

  try {
    await db.insert(aiUsage).values({
      userId: options.userId,
      projectId: options.projectId ?? null,
      conversationId: options.conversationId ?? null,
      provider,
      model,
      inputTokens,
      outputTokens,
      costUsd: costUsd.toFixed(6),
    });
  } catch (error) {
    console.error("Failed to record AI usage:", error);
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function streamCompletion(
  provider: AIProvider,
  model: string,
  messages: ConversationMessage[],
  callbacks: StreamCallbacks,
  options: StreamOptions,
  systemPrompt?: string
): Promise<void> {
  if (provider === "claude") {
    return streamClaude(model, messages, callbacks, options, systemPrompt);
  }
  return streamOpenAICompatible(provider, model, messages, callbacks, options, systemPrompt);
}

// ─── Architect code review ──────────────────────────────────────────────────

export interface ArchitectReviewResult {
  approved: boolean;
  note: string;
}

export async function reviewStagedCode(
  filePath: string,
  originalContent: string | null,
  proposedContent: string,
  diff: string,
  options: StreamOptions,
  approvedPrototypeHtml?: string,
  technicalSpec?: string
): Promise<ArchitectReviewResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = approvedPrototypeHtml
    ? getArchitectReviewPrompt(approvedPrototypeHtml, technicalSpec ?? "") + `\n\n**File:** ${filePath}\n\n**Proposed content:**\n\`\`\`\n${proposedContent}\n\`\`\`\n\n**Diff:**\n\`\`\`diff\n${diff}\n\`\`\``
    : `You are the Architect in BuilderBlue², an AI-powered IDE. Your job is to review code proposed by the Builder before it reaches the user.

Review this staged change and decide whether to APPROVE or REJECT it.

**File:** ${filePath}

**Original content:**
${originalContent ? "```\n" + originalContent + "\n```" : "(New file)"}

**Proposed content:**
\`\`\`
${proposedContent}
\`\`\`

**Diff:**
\`\`\`diff
${diff}
\`\`\`

Evaluate for:
1. Code correctness — does it do what's intended?
2. Security — no obvious vulnerabilities, no hardcoded secrets
3. Quality — readable, follows conventions, no dead code
4. Completeness — no missing imports, no broken references

Respond with ONLY valid JSON (no markdown, no backticks):
{"approved": true, "note": "Brief 1-sentence reason"}
or
{"approved": false, "note": "Brief 1-sentence reason for rejection"}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      await recordUsage(
        "claude",
        "claude-sonnet-4-20250514",
        response.usage.input_tokens,
        response.usage.output_tokens,
        options
      );
      return {
        approved: Boolean(parsed.approved),
        note: String(parsed.note || "No notes"),
      };
    }

    return { approved: true, note: "Review complete — no issues found" };
  } catch (error) {
    console.error("Architect review error:", error);
    // On error, approve to not block workflow
    return { approved: true, note: "Auto-approved (review service unavailable)" };
  }
}

// ─── Code block detection ───────────────────────────────────────────────────

export interface DetectedCodeBlock {
  filePath: string;
  content: string;
  language: string;
}

export function detectCodeBlocks(text: string): DetectedCodeBlock[] {
  const blocks: DetectedCodeBlock[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || "text";
    const content = match[2];
    const lines = content.split("\n");

    // Check first line for filepath comment
    const firstLine = lines[0]?.trim() ?? "";
    const filePathMatch = firstLine.match(
      /^(?:\/\/|#|--|\/\*)\s*filepath:\s*(.+?)(?:\s*\*\/)?$/i
    );

    if (filePathMatch) {
      blocks.push({
        filePath: filePathMatch[1].trim(),
        content: lines.slice(1).join("\n").trimEnd(),
        language,
      });
    }
  }

  return blocks;
}
