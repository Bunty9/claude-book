import React from 'react'

function HeartIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="text-red-500 inline-block align-[-1px]"
    >
      <path d="M8 14.25l-.92-.83C3.4 10.07 1 7.9 1 5.25 1 3.42 2.42 2 4.25 2 5.29 2 6.29 2.48 7 3.25 7.71 2.48 8.71 2 9.75 2 11.58 2 13 3.42 13 5.25c0 2.65-2.4 4.82-6.08 8.17l-.92.83z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-subtle py-6 text-center text-sm text-fg-muted">
      <p className="flex items-center justify-center gap-1.5">
        <span>Made with</span>
        <HeartIcon />
        <span>by</span>
        <a
          href="https://github.com/Bunty9"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-fg hover:text-accent transition-colors"
        >
          Bunty9
        </a>
      </p>
    </footer>
  )
}
