"use client";

import { useState } from "react";
import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";

type Line = { role: string; text: string };

function Panel({ agentId }: { agentId: string }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [escalated, setEscalated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onMessage: (m) => setLines((x) => [...x, { role: m.role, text: m.message }].slice(-12)),
    onError: (m) => setError(typeof m === "string" ? m : "ElevenLabs connection error."),
    onDisconnect: (details) => {
      // Don't treat expected user-initiated closures as errors
      if (details.reason !== "user") {
        setError(`Connection closed: ${details.reason}${"closeCode" in details && details.closeCode ? ` (code ${details.closeCode})` : ""}`);
      }
    },
    onDebug: (info) => console.debug("[RemitLine ElevenLabs]", info),
  });

  useConversationClientTool("escalate_to_human", (p: { reason?: string }) => {
    setEscalated(true);
    return `Escalation recorded${p.reason ? `: ${p.reason}` : "."}`;
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  const statusLabel = escalated
    ? "Human handoff"
    : isConnecting
    ? "Connecting"
    : isConnected
    ? (conversation.isSpeaking ? "Speaking" : "Listening")
    : "Standby";

  const headline = escalated
    ? "A team member can take it from here."
    : !isConnected
    ? (isConnecting ? "Connecting to RemitLine…" : "Ask me about a rate, transfer, or salary card.")
    : conversation.isSpeaking
    ? "RemitLine is speaking."
    : "I’m listening for your question.";

  async function start() {
    setError(null);
    setEscalated(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access requires HTTPS or localhost.");
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId, connectionType: "websocket" });
        } catch (e) {
      const detail = e instanceof Error ? e.message : "Failed to establish conversation session.";
      const closeCode = (e as { closeCode?: number })?.closeCode;
      const closeReason = (e as { closeReason?: string })?.closeReason;
      setError(closeCode ? `${detail} (code ${closeCode}${closeReason ? `: ${closeReason}` : ""})` : detail);
    }
  }

  function stop() {
    conversation.endSession();
    setEscalated(false);
  }

  function manualEscalation() {
    setEscalated(true);
  }

  return (
    <main className="min-h-screen overflow-hidden px-5 py-5 sm:px-8 lg:px-12">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-[var(--line)] pb-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--green)] text-sm font-black text-white">R</span>
          <b className="text-sm tracking-[0.18em] text-[var(--green-dark)]">REMITLINE</b>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            Synthetic demo · UAE
          </span>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
        <div>
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-[var(--coral)]">
            ● Everyday money answers, out loud
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.06em] text-[var(--green-dark)] sm:text-7xl">
            Your money questions, <span className="text-[var(--coral)]">in your language.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Ask for a rate, check a transfer reference, or hear what a salary card includes. RemitLine answers in English, Arabic, or Hindi.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            {isConnected ? (
              <button onClick={stop} className="rounded-full bg-[var(--coral)] px-6 py-3.5 text-sm font-bold text-white">
                End conversation
              </button>
            ) : (
              <button
                onClick={start}
                disabled={!agentId || isConnecting}
                className="rounded-full bg-[var(--green)] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {isConnecting ? "Connecting…" : "Start a conversation"}
              </button>
            )}
            <button
              onClick={manualEscalation}
              className="rounded-full border border-[var(--coral)] px-5 py-3.5 text-sm font-bold text-[var(--coral)]"
            >
              Test escalation
            </button>
          </div>

          <p className="mt-5 max-w-md text-xs leading-5 text-[var(--muted)]">
            Starting explicitly asks for microphone permission. This demo uses synthetic data and cannot change an account.
          </p>

          {error && (
            <p className="mt-4 rounded-xl border border-[#f0b1a0] bg-[#fff0eb] px-4 py-3 text-sm text-[#9b3e29]">
              {error}
            </p>
          )}
        </div>

        <div className="relative rounded-[2rem] border border-[var(--line)] bg-[var(--card)] p-4 shadow-[0_24px_70px_rgba(35,58,49,0.1)] sm:p-6">
          <div className="absolute -right-4 -top-5 grid h-20 w-20 rotate-6 place-items-center rounded-2xl bg-[var(--yellow)] text-center text-[10px] font-black uppercase leading-3 tracking-wider text-[var(--ink)] shadow-lg">
            Facts<br />first
          </div>

          <div className="rounded-[1.4rem] bg-[var(--green-dark)] p-6 text-white sm:p-8">
            <div className="flex items-center justify-between border-b border-white/15 pb-5">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#b8d7c7]">Live assistant</span>
              <span className="text-xs text-[#b8d7c7]">● {statusLabel}</span>
            </div>

            <div className="min-h-56 py-8">
              <p className="text-3xl font-black leading-tight tracking-[-0.04em]">
                {headline}
              </p>
              <p className="mt-5 text-sm leading-6 text-[#b8d7c7]">English · العربية · हिन्दी</p>
            </div>

            {escalated ? (
              <div className="rounded-xl bg-[var(--coral)] px-4 py-3 text-sm font-bold">
                Escalated safely — no attempt to resolve or advise. A human representative is notified.
              </div>
            ) : (
              <div className="flex gap-2">
                <span className="rounded-full bg-white/10 px-3 py-2 text-xs">Rate · INR</span>
                <span className="rounded-full bg-white/10 px-3 py-2 text-xs">Status · RL-48291</span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
            <div className="mb-3 flex justify-between text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              <span>Live transcript</span>
              <span>{conversation.status}</span>
            </div>
            <div className="max-h-40 space-y-2 overflow-auto text-sm">
              {lines.length === 0 ? (
                <p className="text-[var(--muted)]">Transcript appears after the microphone connects.</p>
              ) : (
                lines.map((l, i) => (
                  <p key={`${i}-${l.text}`}>
                    <b className="text-[var(--green)]">{l.role === "user" ? "You" : "RemitLine"}:</b> {l.text}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function VoiceAgent({ agentId }: { agentId: string }) {
  return (
    <ConversationProvider>
      <Panel agentId={agentId} />
    </ConversationProvider>
  );
}

