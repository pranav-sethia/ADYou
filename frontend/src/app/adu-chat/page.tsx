import { RAGChat } from "@/components/rag-chat";
import { AnimatedBackground } from "@/components/animated-background";

export default function ADUChatPage() {
  return (
    <main className="relative h-screen overflow-hidden bg-background">
      <AnimatedBackground />
      <div className="relative z-10 h-full">
        <RAGChat />
      </div>
    </main>
  );
}
