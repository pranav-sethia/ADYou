"use client";

/**
 * DrawControl — wraps @mapbox/mapbox-gl-draw inside react-map-gl's
 * useControl hook so it plays nicely with the React lifecycle.
 */

import { useControl } from "react-map-gl/mapbox";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import type { ControlPosition } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface DrawControlProps {
    position?: ControlPosition;
    displayControlsDefault?: boolean;
    controls?: Record<string, boolean>;
    defaultMode?: string;
    onCreate?: (evt: { features: GeoJSON.Feature[] }) => void;
    onUpdate?: (evt: { features: GeoJSON.Feature[] }) => void;
    onDelete?: (evt: { features: GeoJSON.Feature[] }) => void;
    /** Ref callback so the parent can access the draw instance */
    drawRef?: React.MutableRefObject<MapboxDraw | null>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function DrawControl(props: DrawControlProps) {
    const draw = useControl<MapboxDraw>(
        () => {
            const instance = new MapboxDraw({
                displayControlsDefault: props.displayControlsDefault ?? false,
                controls: props.controls ?? {},
                defaultMode: props.defaultMode ?? "simple_select",
                styles: drawStyles,
            });
            return instance;
        },
        ({ map }) => {
            if (props.onCreate) map.on("draw.create", props.onCreate);
            if (props.onUpdate) map.on("draw.update", props.onUpdate);
            if (props.onDelete) map.on("draw.delete", props.onDelete);
        },
        ({ map }) => {
            if (props.onCreate) map.off("draw.create", props.onCreate);
            if (props.onUpdate) map.off("draw.update", props.onUpdate);
            if (props.onDelete) map.off("draw.delete", props.onDelete);
        },
        { position: props.position ?? "top-right" },
    );

    // Expose the draw instance to parent via ref
    if (props.drawRef) {
        props.drawRef.current = draw;
    }

    return null;
}

/* ------------------------------------------------------------------ */
/*  Custom draw styles                                                */
/* ------------------------------------------------------------------ */

const drawStyles = [
    // Polygon fill
    {
        id: "gl-draw-polygon-fill",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        paint: {
            "fill-color": [
                "case",
                ["==", ["get", "user_type"], "property"],
                "#6366f1",  // indigo for property
                "#22d3ee",  // cyan for ADU
            ],
            "fill-opacity": 0.15,
        },
    },
    // Polygon outline
    {
        id: "gl-draw-polygon-stroke-active",
        type: "line",
        filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint: {
            "line-color": [
                "case",
                ["==", ["get", "user_type"], "property"],
                "#818cf8",
                "#22d3ee",
            ],
            "line-width": 2.5,
            "line-dasharray": [
                "case",
                ["==", ["get", "user_type"], "property"],
                ["literal", [3, 2]],
                ["literal", [1, 0]],
            ],
        },
    },
    // Vertices
    {
        id: "gl-draw-polygon-and-line-vertex-active",
        type: "circle",
        filter: [
            "all",
            ["==", "meta", "vertex"],
            ["==", "$type", "Point"],
            ["!=", "mode", "static"],
        ],
        paint: {
            "circle-radius": 5,
            "circle-color": "#ffffff",
            "circle-stroke-color": "#6366f1",
            "circle-stroke-width": 2,
        },
    },
    // Midpoints
    {
        id: "gl-draw-polygon-midpoint",
        type: "circle",
        filter: ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"]],
        paint: {
            "circle-radius": 3,
            "circle-color": "#a5b4fc",
        },
    },
    // Static polygon fill (for completed drawings)
    {
        id: "gl-draw-polygon-fill-static",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
        paint: {
            "fill-color": [
                "case",
                ["==", ["get", "user_type"], "property"],
                "#6366f1",
                "#22d3ee",
            ],
            "fill-opacity": 0.1,
        },
    },
    // Static polygon outline
    {
        id: "gl-draw-polygon-stroke-static",
        type: "line",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint: {
            "line-color": [
                "case",
                ["==", ["get", "user_type"], "property"],
                "#818cf8",
                "#22d3ee",
            ],
            "line-width": 2,
        },
    },
];
