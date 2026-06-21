import React from 'react'
import type { MDXComponents } from 'mdx/types'
import { Callout } from './Callout'
import { CodeBlock } from './CodeBlock'
import { Figure } from './Figure'
import { Mermaid } from './Mermaid'
import { Markmap } from './Markmap'
import { PathPicker } from './PathPicker'
import { Tokenizer } from './widgets/Tokenizer'
import { HarnessExplorer } from './widgets/HarnessExplorer'
import { ContextWindowSim } from './widgets/ContextWindowSim'
import { AgentOrchestrationVisualizer } from './widgets/AgentOrchestrationVisualizer'
import { PromptLab } from './widgets/PromptLab'
import { ToolSurfaceMap } from './widgets/ToolSurfaceMap'
import { EcosystemExplorer } from './widgets/EcosystemExplorer'
import { WorktreeWorkflowAnimator } from './widgets/WorktreeWorkflowAnimator'
import { TDDLoopVisualizer } from './widgets/TDDLoopVisualizer'
import { DecisionTrees } from './widgets/DecisionTrees'
import { Quiz } from './widgets/Quiz'

/** Props we expect on the <code> child of a fenced code block. */
type CodeProps = { className?: string; children?: string }

/** Returns true when an unknown value is a CodeProps-shaped object. */
function hasCodeProps(props: unknown): props is CodeProps {
  if (typeof props !== 'object' || props === null) return false
  // Use `in` narrowing to access individual keys without a cast.
  const classNameOk =
    !('className' in props) || typeof props.className === 'string'
  const childrenOk =
    !('children' in props) || typeof props.children === 'string'
  return classNameOk && childrenOk
}

/** Narrows a valid React element to one carrying CodeProps on a <code> tag. */
function isCodeElement(el: React.ReactElement): el is React.ReactElement<CodeProps> {
  return el.type === 'code' && hasCodeProps(el.props)
}

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
  if (React.isValidElement(children) && isCodeElement(children)) {
    const source =
      typeof children.props.children === 'string'
        ? children.props.children
        : ''
    return (
      <CodeBlock className={children.props.className}>
        {source}
      </CodeBlock>
    )
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
  PathPicker,
  Tokenizer,
  HarnessExplorer,
  ContextWindowSim,
  AgentOrchestrationVisualizer,
  PromptLab,
  ToolSurfaceMap,
  EcosystemExplorer,
  WorktreeWorkflowAnimator,
  TDDLoopVisualizer,
  DecisionTrees,
  Quiz,

  // Override <pre> to route fenced code through CodeBlock
  pre: PreOverride,
}
