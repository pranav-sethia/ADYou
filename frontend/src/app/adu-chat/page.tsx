"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RAGChat } from "@/components/rag-chat";
import { AnimatedBackground } from "@/components/animated-background";
import type { PropertyContext } from "@/types";

function ChatWithContext() {
  const sp = useSearchParams();

  const propertyContext: PropertyContext | undefined = sp.get("fromMap")
    ? {
        address: sp.get("address") ?? undefined,
        lat: sp.get("lat") ? Number(sp.get("lat")) : undefined,
        lng: sp.get("lng") ? Number(sp.get("lng")) : undefined,
        aduSize: sp.get("aduSize") ? Number(sp.get("aduSize")) : undefined,
        aduShape: sp.get("aduShape") ?? undefined,
        setback: sp.get("setback") ? Number(sp.get("setback")) : undefined,
        propertyArea: sp.get("propertyArea") ? Number(sp.get("propertyArea")) : undefined,
        buildableArea: sp.get("buildableArea") ? Number(sp.get("buildableArea")) : undefined,
        maxAduSqft: sp.get("maxAduSqft") ? Number(sp.get("maxAduSqft")) : undefined,
        apn: sp.get("apn") ?? undefined,
      }
    : undefined;

  return <RAGChat propertyContext={propertyContext} />;
}

export default function ADUChatPage() {
  return (
    <main className="relative h-screen overflow-hidden bg-background">
      <AnimatedBackground />
      <div className="relative z-10 h-full">
        <Suspense>
          <ChatWithContext />
        </Suspense>
      </div>
    </main>
  );
}
