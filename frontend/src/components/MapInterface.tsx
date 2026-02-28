"use client";

/**
 * MapInterface — Full-screen Mapbox satellite view with single-step
 * property drawing. After the user traces their property boundary,
 * the backend computes and returns the legal buildable zone, which is
 * rendered as a green overlay on the map.
 */

import { useRef, useState, useCallback } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import DrawControl from "./DrawControls";
import ValidationHUD from "./ValidationHUD";
import AddressSearch from "./AddressSearch";

import type {
    GeoJSONGeometry,
    ValidationRequest,
    ValidationResponse,
} from "@/types";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const IRVINE_CENTER = { longitude: -117.7731, latitude: 33.6846 };

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function MapInterface() {
    const mapRef = useRef<MapRef | null>(null);
    const drawRef = useRef<MapboxDraw | null>(null);

    // Simple state: have we drawn something?
    const [hasDrawn, setHasDrawn] = useState(false);

    // Validation state
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ValidationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Buildable zone overlay (returned from backend)
    const [buildableZone, setBuildableZone] = useState<GeoJSON.Feature | null>(
        null,
    );

    /* ---------------------------------------------------------------- */
    /*  Handlers                                                        */
    /* ---------------------------------------------------------------- */

    const handleDrawProperty = useCallback(() => {
        setHasDrawn(false);
        drawRef.current?.changeMode("draw_polygon");
    }, []);

    const handleReset = useCallback(() => {
        drawRef.current?.deleteAll();
        setHasDrawn(false);
        setResult(null);
        setError(null);
        setBuildableZone(null);
    }, []);

    /** Fly the map to a geocoded address */
    const handleAddressResult = useCallback(
        (lng: number, lat: number, _placeName: string) => {
            mapRef.current?.flyTo({
                center: [lng, lat],
                zoom: 19,
                duration: 2000,
            });
        },
        [],
    );

    /** Called when the user finishes drawing. No phase-dependence needed. */
    const handleDrawCreate = useCallback(
        async (evt: { features: GeoJSON.Feature[] }) => {
            const feature = evt.features[0];
            if (!feature || feature.geometry.type !== "Polygon") return;

            const geometry = feature.geometry as GeoJSONGeometry;
            setHasDrawn(true);

            // Send to backend for buildable zone computation
            await computeBuildableZone(geometry);
        },
        [],
    );

    /** Send property polygon to the backend */
    const computeBuildableZone = async (propertyGeometry: GeoJSONGeometry) => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setBuildableZone(null);

        const payload: ValidationRequest = {
            property_boundary: propertyGeometry,
            location: "irvine_ca",
        };

        try {
            const res = await fetch(`${API_URL}/validate-placement`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const detail = await res.json().catch(() => null);
                throw new Error(detail?.detail ?? `Server error (${res.status})`);
            }

            const data: ValidationResponse = await res.json();
            setResult(data);

            // Render the buildable zone if the backend returned one
            if (data.buildable_zone_geojson) {
                setBuildableZone({
                    type: "Feature",
                    properties: { valid: data.is_valid },
                    geometry: data.buildable_zone_geojson as unknown as GeoJSON.Geometry,
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Network error");
        } finally {
            setIsLoading(false);
        }
    };

    /* ---------------------------------------------------------------- */
    /*  Render                                                          */
    /* ---------------------------------------------------------------- */

    return (
        <div className="relative w-full h-full">
            <Map
                ref={mapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                    ...IRVINE_CENTER,
                    zoom: 18,
                    pitch: 0,
                    bearing: 0,
                }}
                maxZoom={22}
                mapStyle="mapbox://styles/mapbox/satellite-v9"
                style={{ width: "100%", height: "100%" }}
                attributionControl={false}
            >
                <NavigationControl position="bottom-right" />

                <DrawControl
                    drawRef={drawRef}
                    position="top-right"
                    displayControlsDefault={false}
                    controls={{
                        polygon: false,
                        trash: true,
                    }}
                    onCreate={handleDrawCreate}
                    onUpdate={handleDrawCreate}
                />

                {/* Buildable Zone Overlay (returned from backend) */}
                {buildableZone && (
                    <Source
                        id="buildable-zone"
                        type="geojson"
                        data={{
                            type: "FeatureCollection",
                            features: [buildableZone],
                        }}
                    >
                        <Layer
                            id="buildable-fill"
                            type="fill"
                            paint={{
                                "fill-color": "#22c55e",
                                "fill-opacity": 0.3,
                            }}
                        />
                        <Layer
                            id="buildable-outline"
                            type="line"
                            paint={{
                                "line-color": "#22c55e",
                                "line-width": 2.5,
                            }}
                        />
                    </Source>
                )}
            </Map>

            {/* HUD Overlay */}
            <ValidationHUD
                hasDrawn={hasDrawn}
                isLoading={isLoading}
                result={result}
                error={error}
                onDrawProperty={handleDrawProperty}
                onReset={handleReset}
            />

            {/* Address Search Bar */}
            <AddressSearch
                accessToken={MAPBOX_TOKEN}
                onResult={handleAddressResult}
            />
        </div>
    );
}
