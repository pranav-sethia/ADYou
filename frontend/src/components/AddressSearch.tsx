"use client";

/**
 * AddressSearch — Mapbox SearchBox geocoder that flies the map to the
 * selected address. Uses @mapbox/search-js-react.
 */

import { useCallback } from "react";
import { SearchBox } from "@mapbox/search-js-react";

interface AddressSearchProps {
    accessToken: string;
    onResult: (lng: number, lat: number, placeName: string) => void;
}

export default function AddressSearch({
    accessToken,
    onResult,
}: AddressSearchProps) {
    const handleRetrieve = useCallback(
        (res: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const feature = (res as any)?.features?.[0];
            if (!feature) return;
            const [lng, lat] = feature.geometry.coordinates;
            const placeName =
                feature.properties?.full_address ||
                feature.properties?.name ||
                "Selected location";
            onResult(lng, lat, placeName);
        },
        [onResult],
    );

    return (
        <div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-96 shadow-lg rounded-xl"
            style={{
                // @ts-expect-error - Injecting variables for Shadow DOM penetration
                '--mapbox-search-box-text-color': '#0f172a',
                '--mapbox-search-box-input-text-color': '#0f172a',
                '--mapbox-search-box-suggestion-text-color': '#0f172a',
            }}
        >
            <SearchBox
                accessToken={accessToken}
                onRetrieve={handleRetrieve}
                placeholder="Search for your address…"
                options={{
                    country: "US",
                    proximity: [-117.7731, 33.6846], // Irvine bias
                    types: "address,place",
                }}
                theme={{
                    variables: {
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.08)",
                        border: "1px solid rgba(0, 0, 0, 0.05)",
                        colorBackground: "#ffffff",
                        colorBackgroundActive: "#f8fafc",
                        colorBackgroundHover: "#f1f5f9",
                        colorText: "#0f172a",
                        colorSecondary: "#64748b",
                        colorPrimary: "#10b981", // Emerald-500
                    },
                }}
            />
        </div>
    );
}
