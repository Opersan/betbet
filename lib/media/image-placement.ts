import type { CSSProperties } from "react";

export type ImagePlacement = {
  x: number;
  y: number;
  zoom: number;
  mode: "cover" | "contain";
};

export const defaultImagePlacement: ImagePlacement = {
  x: 0,
  y: 0,
  zoom: 100,
  mode: "cover",
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
  const [rawX, rawY, rawZoom, rawMode] = source.slice(markerIndex + placementMarker.length).split(",");

  return {
    src,
    placement: normalizeImagePlacement({
      x: finiteNumber(rawX, defaultImagePlacement.x),
      y: finiteNumber(rawY, defaultImagePlacement.y),
      zoom: finiteNumber(rawZoom, defaultImagePlacement.zoom),
      mode: rawMode === "contain" ? "contain" : "cover",
    }),
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
    && normalized.mode === defaultImagePlacement.mode
  ) {
    return src;
  }

  return `${src}${placementMarker}${normalized.x},${normalized.y},${normalized.zoom},${normalized.mode}`;
}

export function imagePlacementStyle(value: string | null | undefined): CSSProperties {
  const { placement } = readImagePlacement(value);
  const horizontalFocus = 50 + placement.x;
  const verticalFocus = 50 + placement.y;

  return {
    objectFit: placement.mode,
    objectPosition: `${horizontalFocus}% ${verticalFocus}%`,
    transform: `scale(${placement.zoom / 100})`,
    transformOrigin: `${horizontalFocus}% ${verticalFocus}%`,
  };
}

export function normalizeImagePlacement(placement: ImagePlacement): ImagePlacement {
  return {
    x: clamp(round(placement.x), -50, 50),
    y: clamp(round(placement.y), -50, 50),
    zoom: clamp(round(placement.zoom), 100, 250),
    mode: placement.mode === "contain" ? "contain" : "cover",
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
