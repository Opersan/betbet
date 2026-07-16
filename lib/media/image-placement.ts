import type { CSSProperties } from "react";

export type ImagePlacement = {
  x: number;
  y: number;
  zoom: number;
};

export const defaultImagePlacement: ImagePlacement = {
  x: 0,
  y: 0,
  zoom: 100,
};

const placementMarker = "#bet-placement=";

export function readImagePlacement(value: string | null | undefined): {
  src: string;
  placement: ImagePlacement;
} {
  const source = value ?? "";
  const markerIndex = source.lastIndexOf(placementMarker);

  if (markerIndex === -1) {
    return { src: source, placement: defaultImagePlacement };
  }

  const src = source.slice(0, markerIndex);
  const [rawX, rawY, rawZoom] = source.slice(markerIndex + placementMarker.length).split(",");

  return {
    src,
    placement: {
      x: finiteNumber(rawX, defaultImagePlacement.x),
      y: finiteNumber(rawY, defaultImagePlacement.y),
      zoom: finiteNumber(rawZoom, defaultImagePlacement.zoom),
    },
  };
}

export function writeImagePlacement(
  value: string | null | undefined,
  placement: ImagePlacement,
) {
  const { src } = readImagePlacement(value);
  const normalized = normalizeImagePlacement(placement);

  if (
    normalized.x === defaultImagePlacement.x
    && normalized.y === defaultImagePlacement.y
    && normalized.zoom === defaultImagePlacement.zoom
  ) {
    return src;
  }

  return `${src}${placementMarker}${normalized.x},${normalized.y},${normalized.zoom}`;
}

export function imagePlacementStyle(value: string | null | undefined): CSSProperties {
  const { placement } = readImagePlacement(value);

  return {
    transform: `translate3d(${placement.x}px, ${placement.y}px, 0) scale(${placement.zoom / 100})`,
    transformOrigin: "center",
  };
}

export function normalizeImagePlacement(placement: ImagePlacement): ImagePlacement {
  return {
    x: clamp(round(placement.x), -500, 500),
    y: clamp(round(placement.y), -500, 500),
    zoom: clamp(round(placement.zoom), 50, 250),
  };
}

function finiteNumber(value: string | number | undefined, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
