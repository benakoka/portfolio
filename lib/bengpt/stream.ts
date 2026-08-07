/**
 * Minimal client-side reader for the newline-delimited JSON stream produced
 * by `MessageStream.toReadableStream()` on the server (see
 * app/api/bengpt/chat/route.ts). Each line is one raw Anthropic streaming
 * event; we only care about text deltas here.
 */

type AnthropicStreamEvent = {
  type: string;
  delta?: { type: string; text?: string };
  error?: { message?: string };
};

export async function streamBenGptReply(
  response: Response,
  onTextDelta: (delta: string) => void,
): Promise<void> {
  const body = response.body;
  if (!body) throw new Error("Empty response body.");

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = parseLine(line);
      if (event?.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
        onTextDelta(event.delta.text);
      }
    }
  }

  if (buffer.trim()) {
    const event = parseLine(buffer);
    if (event?.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
      onTextDelta(event.delta.text);
    }
  }
}

function parseLine(line: string): AnthropicStreamEvent | null {
  try {
    return JSON.parse(line) as AnthropicStreamEvent;
  } catch {
    return null;
  }
}
