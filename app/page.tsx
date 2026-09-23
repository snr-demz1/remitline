import HomeClient from "@/app/HomeClient";

export default function Home() {
  return <HomeClient agentId={process.env.NEXT_PUBLIC_AGENT_ID ?? ""} />;
}
