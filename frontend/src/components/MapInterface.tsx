"use client";

/**
 * MapInterface — Full-screen Mapbox satellite view with two-phase drawing
 * workflow: (1) draw property boundary, (2) draw ADU footprint.
 *
 * After both polygons are drawn, automatically sends them to the backend
 * for validation and renders visual feedback.
 */

import { useRef, useState, useCallback } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import DrawControl from "./DrawControls";
import ValidationHUD from "./ValidationHUD";
import AddressSearch from "./AddressSearch";

import type {
    DrawingPhase,
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

    // Drawing workflow state
    const [phase, setPhase] = useState<DrawingPhase>("idle");
    const [propertyGeometry, setPropertyGeometry] =
        useState<GeoJSONGeometry | null>(null);
    const [propertyFeatureId, setPropertyFeatureId] = useState<string | null>(
        null,
    );

    // Validation state
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ValidationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Result color overlay GeoJSON
    const [resultOverlay, setResultOverlay] = useState<GeoJSON.Feature | null>(
        null,
    );

    /* ---------------------------------------------------------------- */
    /*  Handlers                                                        */
    /* ---------------------------------------------------------------- */

    const handleDrawProperty = useCallback(() => {
        setPhase("property");
        drawRef.current?.changeMode("draw_polygon");
    }, []);

    const handleDrawADU = useCallback(() => {
        setPhase("adu");
        drawRef.current?.changeMode("draw_polygon");
    }, []);

    const handleReset = useCallback(() => {
        drawRef.current?.deleteAll();
        setPhase("idle");
        setPropertyGeometry(null);
        setPropertyFeatureId(null);
        setResult(null);
        setError(null);
        setResultOverlay(null);
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

    /** Called whenever a polygon draw finishes */
    const handleDrawCreate = useCallback(
        async (evt: { features: GeoJSON.Feature[] }) => {
            const feature = evt.features[0];
            if (!feature || feature.geometry.type !== "Polygon") return;

            const geometry = feature.geometry as GeoJSONGeometry;

            if (phase === "property") {
                // Tag the property feature for styling
                if (drawRef.current && feature.id) {
                    drawRef.current.setFeatureProperty(
                        feature.id as string,
                        "type",
                        "property",
                    );
                }

                setPropertyGeometry(geometry);
                setPropertyFeatureId(feature.id as string);
                setPhase("adu");
                return;
            }

            if (phase === "adu" && propertyGeometry) {
                // Tag ADU feature for styling
                if (drawRef.current && feature.id) {
                    drawRef.current.setFeatureProperty(
                        feature.id as string,
                        "type",
                        "adu",
                    );
                }

                // Validate
                await validatePlacement(propertyGeometry, geometry, feature);
            }
        },
        [phase, propertyGeometry],
    );

    /** Send both polygons to the backend */
    const validatePlacement = async (
        property: GeoJSONGeometry,
        adu: GeoJSONGeometry,
        aduFeature: GeoJSON.Feature,
    ) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        const payload: ValidationRequest = {
            property_boundary: property,
            adu_box: adu,
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
                throw new Error(
                    detail?.detail ?? `Server error (${res.status})`,
                );
            }

            const data: ValidationResponse = await res.json();
            setResult(data);

            // Create result overlay for color feedback
            setResultOverlay({
                type: "Feature",
                properties: {
                    valid: data.is_valid,
                },
                geometry: adu,
            });
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
                mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
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

                {/* Result color overlay */}
                {resultOverlay && (
                    <Source
                        id="result-overlay"
                        type="geojson"
                        data={{
                            type: "FeatureCollection",
                            features: [resultOverlay],
                        }}
                    >
                        <Layer
                            id="result-fill"
                            type="fill"
                            paint={{
                                "fill-color": [
                                    "case",
                                    ["==", ["get", "valid"], true],
                                    "#22c55e",
                                    "#ef4444",
                                ],
                                "fill-opacity": 0.35,
                            }}
                        />
                        <Layer
                            id="result-outline"
                            type="line"
                            paint={{
                                "line-color": [
                                    "case",
                                    ["==", ["get", "valid"], true],
                                    "#22c55e",
                                    "#ef4444",
                                ],
                                "line-width": 3,
                            }}
                        />
                    </Source>
                )}
            </Map>

            {/* HUD Overlay */}
            <ValidationHUD
                phase={phase}
                isLoading={isLoading}
                result={result}
                error={error}
                onDrawProperty={handleDrawProperty}
                onDrawADU={handleDrawADU}
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
