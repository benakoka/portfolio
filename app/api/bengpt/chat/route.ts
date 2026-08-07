import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/bengpt/persona";
import { checkRateLimit, getClientIp } from "@/lib/bengpt/rateLimit";

// Needs a long-lived Node runtime for streaming + the SDK's Node fetch usage.
export const runtime = "nodejs";

const MAX_MESSAGE_CHARS = 800;
const MAX_HISTORY_MESSAGES = 20; // bounds context growth (and therefore cost) per conversation
const MAX_OUTPUT_TOKENS = 700;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && typeof v.content === "string";
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "BenGPT isn't fully set up yet — missing server config." },
      { status: 500 },
    );
  }

  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return Response.json(
      { error: "That's a lot of messages in a short window — give it a few minutes and try again." },
      {
        status: 429,
        headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined,
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const rawMessages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return Response.json({ error: "No message provided." }, { status: 400 });
  }

  const cleaned: ChatMessage[] = [];
  for (const m of rawMessages) {
    if (!isChatMessage(m)) {
      return Response.json({ error: "Malformed message." }, { status: 400 });
    }
    const content = m.content.slice(0, MAX_MESSAGE_CHARS).trim();
    if (content.length > 0) cleaned.push({ role: m.role, content });
  }

  // Bound the conversation to the most recent turns, then make sure it
  // starts on a user turn (the API requires the first message be "user").
  const trimmed = cleaned.slice(-MAX_HISTORY_MESSAGES);
  while (trimmed.length > 0 && trimmed[0].role !== "user") trimmed.shift();

  if (trimmed.length === 0) {
    return Response.json({ error: "No message provided." }, { status: 400 });
  }

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: trimmed,
  });

  // Newline-delimited JSON of the raw stream events — cheap to parse on the
  // client without pulling the SDK into the browser bundle.
  return new Response(stream.toReadableStream(), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
