"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { streamBenGptReply } from "@/lib/bengpt/stream";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What are you working on right now?",
  "Tell me about the NBA project.",
  "Are you looking for internships?",
  "Why UCSB?",
];

const GENERIC_ERROR = "Something went wrong on my end — give it another try in a sec.";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  // Grow the textarea with its content, up to the CSS max-height (which then scrolls).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...nextHistory, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/bengpt/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? GENERIC_ERROR);
        setMessages(nextHistory);
        return;
      }

      let assistantText = "";
      await streamBenGptReply(response, (delta) => {
        assistantText += delta;
        setMessages([...nextHistory, { role: "assistant", content: assistantText }]);
        scrollToBottom();
      });

      if (!assistantText) {
        setError(GENERIC_ERROR);
        setMessages(nextHistory);
      }
    } catch {
      setError(GENERIC_ERROR);
      setMessages(nextHistory);
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="bengpt-card">
      <div className="bengpt-bar">
        <span className="t-dot t-red"></span>
        <span className="t-dot t-yellow"></span>
        <span className="t-dot t-green"></span>
        <span className="bengpt-bar-title">bengpt@benakoka — zsh</span>
      </div>

      <div className="bengpt-log" ref={logRef}>
        {messages.length === 0 && (
          <div className="bengpt-empty">
            <p>Ask me anything about Ben — background, projects, whether he&apos;d be a fit for something. I can also help with quick everyday stuff.</p>
            <div className="bengpt-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} disabled={isStreaming}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`bengpt-msg bengpt-msg-${m.role}`}>
            <span className="bengpt-msg-label">{m.role === "user" ? "you" : "ben"}</span>
            <p>
              {m.content || (isStreaming && i === messages.length - 1 ? <span className="bengpt-cursor" /> : "")}
            </p>
          </div>
        ))}

        {error && <div className="bengpt-error">{error}</div>}
      </div>

      <form className="bengpt-input-row" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message BenGPT..."
          rows={1}
          maxLength={800}
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
