import React from 'react'
import Link from 'next/link'
import { PartId } from '@/content/types'
import { PART_LABELS } from '@/content/parts'

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
