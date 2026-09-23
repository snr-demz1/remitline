"use client";

import dynamic from "next/dynamic";

const VoiceAgent = dynamic(() => import("@/app/VoiceAgent"), {
  ssr: false,
  loading: () => <main className="min-h-screen bg-[var(--paper)]" aria-label="Loading RemitLine" />,
});

export default function HomeClient({ agentId }: { agentId: string }) {
  return <VoiceAgent agentId={agentId} />;
}
