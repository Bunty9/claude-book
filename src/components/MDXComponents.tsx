import React from 'react'
import type { MDXComponents } from 'mdx/types'
import { Callout } from './Callout'
import { CodeBlock } from './CodeBlock'
import { Figure } from './Figure'
import { Mermaid } from './Mermaid'
import { Markmap } from './Markmap'

/**
 * MDX renders fenced code as:
 *   <pre><code class="language-x">…source…</code></pre>
 *
 * We intercept <pre> to extract the child <code>'s text + className,
 * then route through <CodeBlock> for shiki highlighting + copy button.
 * Inline <code> (not inside <pre>) keeps the global chip style from globals.css.
 */
function PreOverride({
  children,
  ...rest
}: React.HTMLAttributes<HTMLPreElement>) {
  // MDX nests a single <code> element directly inside <pre>
  if (React.isValidElement(children)) {
    const codeEl = children as React.ReactElement<{
      className?: string
      children?: string
    }>
    if (codeEl.type === 'code') {
      const source =
        typeof codeEl.props.children === 'string'
          ? codeEl.props.children
          : ''
      return (
        <CodeBlock className={codeEl.props.className}>
          {source}
        </CodeBlock>
      )
    }
  }

  // Fallback: render a plain <pre> with token-backed styling
  return (
    <pre {...rest} className="bg-code-bg border border-code-border rounded p-4 overflow-x-auto my-4 text-sm">
      {children}
    </pre>
  )
}

export const mdxComponents: MDXComponents = {
  // Named components available in .mdx files
  Callout,
  CodeBlock,
  Figure,
  Mermaid,
  Markmap,

  // Override <pre> to route fenced code through CodeBlock
  pre: PreOverride,
}
