declare module "@mapbox/mapbox-gl-draw" {
    import type { IControl } from "mapbox-gl";

    interface DrawOptions {
        displayControlsDefault?: boolean;
        controls?: Record<string, boolean>;
        defaultMode?: string;
        styles?: object[];
        modes?: Record<string, object>;
    }

    class MapboxDraw implements IControl {
        constructor(options?: DrawOptions);

        onAdd(map: mapboxgl.Map): HTMLElement;
        onRemove(map: mapboxgl.Map): void;

        changeMode(mode: string, options?: object): this;
        getMode(): string;

        getAll(): GeoJSON.FeatureCollection;
        getSelectedIds(): string[];
        get(featureId: string): GeoJSON.Feature | undefined;

        add(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection): string[];
        set(
            featureCollection: GeoJSON.FeatureCollection,
        ): string[];
        delete(ids: string | string[]): this;
        deleteAll(): this;

        setFeatureProperty(
            featureId: string,
            property: string,
            value: unknown,
        ): this;

        trash(): this;
        combineFeatures(): this;
        uncombineFeatures(): this;

        getSelectedPoints(): GeoJSON.FeatureCollection;
    }

    export default MapboxDraw;
}
