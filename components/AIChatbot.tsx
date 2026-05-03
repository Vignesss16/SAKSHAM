"use client";
import React, { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI Career Coach. How can I help you improve your interview performance today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: botMessageId, role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId ? { ...msg, content: msg.content + chunk } : msg
              )
            );
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, content: "Sorry, I encountered an error. Please try again later." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-50 ${
          isOpen ? "bg-[#242b2e] text-[#dde3e7] rotate-90 scale-90" : "bg-[#00d1ff] text-[#001f28] hover:scale-105"
        }`}
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? "close" : "smart_toy"}
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[380px] h-[500px] bg-[#121212]/95 backdrop-blur-xl border border-[#242424] rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 bg-[#1a2123] border-b border-[#242424]">
            <div className="w-10 h-10 rounded-full bg-[#00d1ff]/20 flex items-center justify-center text-[#00d1ff]">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div>
              <h3 className="font-bold text-[#dde3e7]">AI Progress Coach</h3>
              <p className="text-xs text-[#44e2cd]">Online & Context-Aware</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#00d1ff] text-[#001f28] rounded-tr-sm font-medium"
                      : "bg-[#242b2e] text-[#dde3e7] border border-[#3c494e] rounded-tl-sm"
                  }`}
                >
                  {msg.content || (
                    <span className="flex items-center gap-2 text-[#859399]">
                      <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 bg-[#1a2123] border-t border-[#242424]">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for interview advice..."
                className="w-full bg-[#0e1417] border border-[#3c494e] rounded-xl pl-4 pr-12 py-3 text-sm text-[#dde3e7] focus:border-[#00d1ff] focus:ring-1 focus:ring-[#00d1ff] outline-none transition-all placeholder-[#859399]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-[#00d1ff] text-[#001f28] disabled:opacity-50 disabled:bg-[#3c494e] disabled:text-[#859399] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
