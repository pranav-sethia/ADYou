"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

const CHATBOT_ORIGIN = process.env.NEXT_PUBLIC_CHATBOT_ORIGIN ?? "http://localhost:3001";

function ChatEmbed() {
  const sp = useSearchParams();
  const router = useRouter();
  const src = `${CHATBOT_ORIGIN}/adu-chat?${sp.toString()}`;

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "adu-chat-finish") {
        router.push("/");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  return (
    <iframe
      src={src}
      className="w-full h-full border-0"
      allow="clipboard-write"
    />
  );
}

export default function ADUChatPage() {
  return (
    <div className="h-screen w-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full bg-slate-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-600 font-medium">Loading ADU Advisor...</p>
            </div>
          </div>
        }
      >
        <ChatEmbed />
      </Suspense>
    </div>
  );
}
