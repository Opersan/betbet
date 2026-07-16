"use client";

import type { ImgHTMLAttributes } from "react";
import { imagePlacementStyle, readImagePlacement } from "@/lib/media/image-placement";
import { cn } from "@/lib/utils";

export function PositionedImage({
  value,
  alt,
  className,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "style"> & {
  value: string | null | undefined;
}) {
  const { src, placement } = readImagePlacement(value);

  return (
    <>
      {placement.mode === "contain" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-xl"
          src={src}
          alt=""
          draggable={false}
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        className={cn("absolute inset-0 h-full w-full", className)}
        src={src}
        alt={alt}
        style={imagePlacementStyle(value)}
      />
    </>
  );
}
