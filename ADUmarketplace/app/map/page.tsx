import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";

// Dynamically import MapInterface with ssr: false since mapbox-gl requires the window object
const MapInterface = dynamic(() => import("@/components/map/MapInterface"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <h3 className="text-xl font-semibold text-slate-700">Loading Map Engine...</h3>
            </div>
        </div>
    ),
});

export default function MapPage({
    searchParams,
}: {
    searchParams: { lat?: string; lng?: string; name?: string };
}) {
    const lat = searchParams.lat ? parseFloat(searchParams.lat) : undefined;
    const lng = searchParams.lng ? parseFloat(searchParams.lng) : undefined;
    const name = searchParams.name || "Selected Location";

    const initialLocation =
        lat && lng
            ? { lat, lng, name }
            : undefined;

    return (
        <div className="h-screen w-full flex flex-col font-sans overflow-hidden">
            <Header />
            <main className="flex-1 relative w-full h-full">
                <Suspense fallback={null}>
                    <MapInterface initialLocation={initialLocation} />
                </Suspense>
            </main>
        </div>
    );
}
