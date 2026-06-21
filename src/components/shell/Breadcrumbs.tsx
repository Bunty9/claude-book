import React from 'react'
import Link from 'next/link'
import { PartId } from '@/content/types'

const PART_LABELS: Record<PartId, string> = {
  P0: 'Orientation',
  P1: 'Foundations',
  P2: 'Prompting',
  P3: 'Tools & Agents',
  P4: 'Memory & State',
  P5: 'Multimodal',
  P6: 'Safety',
  P7: 'Production',
  P8: 'Evaluation',
  P9: 'Advanced',
  P10: 'Reference',
}

interface BreadcrumbsProps {
  part: PartId
  title: string
}

export function Breadcrumbs({ part, title }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-fg-muted mb-4">
      <Link href="/" className="hover:text-fg transition-colors">Home</Link>
      <span>›</span>
      <span>{PART_LABELS[part]}</span>
      <span>›</span>
      <span className="text-fg truncate">{title}</span>
    </nav>
  )
}
