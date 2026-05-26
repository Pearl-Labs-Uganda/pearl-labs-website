"use client";

import { useState, useRef, useEffect } from "react";
import { Wand2 } from "lucide-react";

interface Message {
  from: "user" | "bot";
  text: string;
}

const quickReplies = [
  "What does Pearl Labs do?",
  "How can I collaborate?",
  "Where are you located?",
  "Talk to a human",
];

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes("what") &&
    (lower.includes("do") || lower.includes("pearl"))
  )
    return "Pearl Labs is a research lab in Uganda focused on building AI solutions for African communities. We work on NLP, computer vision, and more!";
  if (
    lower.includes("collaborat") ||
    lower.includes("partner") ||
    lower.includes("join")
  )
    return "We'd love to collaborate! Reach out via our contact form on the website or message us on WhatsApp.";
  if (
    lower.includes("where") ||
    lower.includes("locat") ||
    lower.includes("address")
  )
    return "We're based in Kampala, Uganda. Feel free to reach out for more details!";
  if (
    lower.includes("human") ||
    lower.includes("agent") ||
    lower.includes("person")
  )
    return "You can reach our team directly on WhatsApp at +256 777 965 265. We're happy to help!";
  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey"))
    return "Hello! Welcome to Pearl Labs. How can I help you today?";
  if (lower.includes("thank"))
    return "You're welcome! Let us know if there's anything else we can help with.";
  return "Thanks for your message! For detailed inquiries, please reach out on WhatsApp at +256 777 965 265 or use our contact form.";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Hi! Welcome to Pearl Labs. How can we help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { from: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: getBotReply(text) },
      ]);
    }, 600);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-orange text-white shadow-[0_4px_20px_rgba(212,112,10,.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
      >
        {open ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] max-h-[480px] rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,.15)] flex flex-col overflow-hidden border border-green/10 font-body">
          {/* Header */}
          <div className="bg-green px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange flex items-center justify-center text-white font-heading font-bold text-sm">
              PL
            </div>
            <div>
              <p className="text-white font-heading font-semibold text-[.95rem] leading-tight">
                Pearl Labs Support
              </p>
              <p className="text-white/60 text-xs">
                We typically reply instantly
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[280px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[.84rem] leading-relaxed ${
                    m.from === "user"
                      ? "bg-orange text-white rounded-br-md"
                      : "bg-cream text-text-dark rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[.72rem] px-2.5 py-1 rounded-full border border-orange/25 text-orange hover:bg-orange-pale transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* WhatsApp link */}
          <a
            href="https://wa.me/256777965265"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25D366]/10 text-[#25D366] text-[.78rem] font-medium hover:bg-[#25D366]/18 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            Chat on WhatsApp: +256 777 965 265
          </a>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 px-3 py-3 border-t border-green/8"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 px-3 py-2 rounded-lg bg-off-white text-[.84rem] text-text-dark outline-none border border-green/8 focus:border-orange/40 transition-colors"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-lg bg-orange text-white flex items-center justify-center hover:bg-orange-mid transition-colors cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
