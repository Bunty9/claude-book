import React from 'react'

type CalloutType = 'note' | 'tip' | 'warning' | 'danger'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: React.ReactNode
}

const ICONS: Record<CalloutType, string> = {
  note: '📝',
  tip: '💡',
  warning: '⚠️',
  danger: '🚨',
}

// Token-backed Tailwind classes derived from globals.css @theme inline mapping.
// e.g. bg-note-subtle → var(--note-subtle), border-note → var(--note), text-note → var(--note)
const STYLES: Record<CalloutType, { border: string; bg: string; accent: string }> = {
  note: {
    border: 'border-note',
    bg: 'bg-note-subtle',
    accent: 'text-note',
  },
  tip: {
    border: 'border-tip',
    bg: 'bg-tip-subtle',
    accent: 'text-tip',
  },
  warning: {
    border: 'border-warning',
    bg: 'bg-warning-subtle',
    accent: 'text-warning',
  },
  danger: {
    border: 'border-danger',
    bg: 'bg-danger-subtle',
    accent: 'text-danger',
  },
}

export function Callout({ type = 'note', title, children }: CalloutProps) {
  const role = type === 'danger' ? 'alert' : 'note'
  const styles = STYLES[type]
  const icon = ICONS[type]

  return (
    <aside
      role={role}
      className={`flex gap-3 rounded border-l-4 p-4 my-4 ${styles.border} ${styles.bg}`}
    >
      <span className={`shrink-0 text-lg leading-snug ${styles.accent}`} aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-semibold text-sm mb-1 ${styles.accent}`}>{title}</p>
        )}
        <div className="text-fg text-sm leading-relaxed">{children}</div>
      </div>
    </aside>
  )
}
