import React from 'react'

interface FigureProps {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

export function Figure({ src, alt, caption, width, height }: FigureProps) {
  return (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded max-w-full h-auto"
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-fg-muted text-center">{caption}</figcaption>
      )}
    </figure>
  )
}
