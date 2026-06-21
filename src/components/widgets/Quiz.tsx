'use client'

import React, { useState, useId } from 'react'
import {
  recordAnswer,
  getVerdict,
  isComplete,
  computeSummary,
  gradeLabel,
  isValidQuestion,
  type QuizQuestion,
  type AnswerMap,
} from '@/lib/quiz'

// ── Sub-components ───────────────────────────────────────────────────────────

interface OptionButtonProps {
  label: string
  index: number
  chosen: boolean
  correct: boolean
  revealed: boolean
  disabled: boolean
  groupName: string
  onSelect: (index: number) => void
}

function OptionButton({
  label,
  index,
  chosen,
  correct,
  revealed,
  disabled,
  groupName,
  onSelect,
}: OptionButtonProps) {
  const id = `${groupName}-opt-${index}`

  // Compute visual state after reveal
  let stateClasses: string
  if (!revealed) {
    stateClasses = chosen
      ? 'border-accent bg-accent-subtle text-fg'
      : 'border-border bg-bg text-fg hover:border-accent hover:bg-accent-subtle/40'
  } else if (correct) {
    stateClasses = 'border-tip bg-tip-subtle text-fg'
  } else if (chosen) {
    stateClasses = 'border-danger bg-danger-subtle text-fg'
  } else {
    stateClasses = 'border-border bg-bg text-fg-muted opacity-60'
  }

  const iconChar = (() => {
    if (!revealed) return null
    if (correct) return '✓'
    if (chosen) return '✗'
    return null
  })()

  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors duration-150 ${stateClasses} ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <input
        type="radio"
        id={id}
        name={groupName}
        value={index}
        checked={chosen}
        disabled={disabled}
        onChange={() => onSelect(index)}
        className="sr-only"
        aria-label={label}
      />
      <span className="font-mono text-xs text-fg-muted w-4 shrink-0 select-none" aria-hidden="true">
        {String.fromCharCode(65 + index)}.
      </span>
      <span className="flex-1">{label}</span>
      {iconChar !== null && (
        <span
          aria-hidden="true"
          className={correct ? 'text-tip font-bold' : 'text-danger font-bold'}
        >
          {iconChar}
        </span>
      )}
    </label>
  )
}

// ── Progress dots ─────────────────────────────────────────────────────────────

interface ProgressDotsProps {
  total: number
  current: number
  answers: AnswerMap
  questions: readonly QuizQuestion[]
  onJump: (i: number) => void
}

function ProgressDots({ total, current, answers, questions, onJump }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="Question navigation">
      {Array.from({ length: total }, (_, i) => {
        const answered = i in answers
        const chosen = answers[i]
        const q = questions[i]
        const verdict = answered && q !== undefined ? getVerdict(q, chosen ?? null) : null
        let dotClass: string
        if (!answered) {
          dotClass = i === current
            ? 'bg-accent w-3.5 h-3.5'
            : 'bg-border w-2.5 h-2.5'
        } else {
          dotClass = verdict === 'correct'
            ? 'bg-tip w-2.5 h-2.5'
            : 'bg-danger w-2.5 h-2.5'
        }
        return (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Question ${i + 1}${answered ? (verdict === 'correct' ? ', correct' : ', incorrect') : ''}`}
            onClick={() => onJump(i)}
            className={`rounded-full transition-all duration-200 ${dotClass} focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-bg-subtle`}
          />
        )
      })}
    </div>
  )
}

// ── Score card ────────────────────────────────────────────────────────────────

interface ScoreCardProps {
  summary: ReturnType<typeof computeSummary>
  onRetry: () => void
}

function ScoreCard({ summary, onRetry }: ScoreCardProps) {
  const grade = gradeLabel(summary.fraction)

  const gradeColor =
    summary.fraction >= 1 ? 'text-tip' :
    summary.fraction >= 0.6 ? 'text-accent' :
    'text-warning'

  return (
    <div className="flex flex-col items-center gap-5 py-6" role="region" aria-label="Quiz results">
      <div className="text-center">
        <p className={`text-4xl font-bold tabular-nums ${gradeColor}`} aria-live="polite">
          {summary.percentLabel}
        </p>
        <p className="mt-1 text-sm font-semibold text-fg-muted">{grade}</p>
      </div>

      <div className="flex gap-8 text-center">
        <div>
          <p className="text-2xl font-bold text-tip tabular-nums">{summary.correct}</p>
          <p className="text-xs text-fg-subtle">Correct</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-danger tabular-nums">
            {summary.total - summary.correct}
          </p>
          <p className="text-xs text-fg-subtle">Incorrect</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-fg tabular-nums">{summary.total}</p>
          <p className="text-xs text-fg-subtle">Total</p>
        </div>
      </div>

      {/* Score bar */}
      <div
        role="meter"
        aria-valuenow={Math.round(summary.fraction * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score: ${summary.percentLabel}`}
        className="w-full max-w-xs h-2.5 rounded-full bg-bg-elevated overflow-hidden border border-border"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            summary.fraction >= 1 ? 'bg-tip' :
            summary.fraction >= 0.6 ? 'bg-accent' :
            'bg-warning'
          }`}
          style={{ width: summary.percentLabel }}
        />
      </div>

      <button
        onClick={onRetry}
        className="mt-2 rounded-lg border border-border bg-bg px-5 py-2 text-sm font-medium text-fg transition-colors hover:border-accent hover:bg-accent-subtle hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-bg-subtle"
      >
        Retry quiz
      </button>
    </div>
  )
}

// ── Main widget ──────────────────────────────────────────────────────────────

export interface QuizProps {
  /** The ordered list of questions for this quiz. */
  questions: readonly QuizQuestion[]
  /** Optional title shown in the widget header. */
  title?: string
}

export function Quiz({ questions, title = 'Knowledge Check' }: QuizProps) {
  const groupPrefix = useId()

  // Filter to only structurally valid questions at render time
  const validQuestions = questions.filter(isValidQuestion)

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [showScore, setShowScore] = useState(false)

  const total = validQuestions.length

  function handleSelect(optionIndex: number) {
    if (current >= total) return
    const updated = recordAnswer(answers, current, optionIndex)
    setAnswers(updated)
  }

  function handleNext() {
    if (current < total - 1) {
      setCurrent(c => c + 1)
    } else {
      // On the last question — show the score card
      setShowScore(true)
    }
  }

  function handleRetry() {
    setAnswers({})
    setCurrent(0)
    setShowScore(false)
  }

  function handleJump(i: number) {
    setShowScore(false)
    setCurrent(i)
  }

  if (total === 0) {
    return (
      <div className="my-6 rounded-lg border border-border bg-bg-subtle p-4 not-prose">
        <p className="text-sm text-fg-muted italic">No valid questions provided.</p>
      </div>
    )
  }

  const currentQuestion = validQuestions[current]
  const chosenIndex = answers[current] ?? null
  const revealed = chosenIndex !== null
  const verdict = currentQuestion !== undefined ? getVerdict(currentQuestion, chosenIndex) : null
  const complete = isComplete(validQuestions, answers)
  const summary = computeSummary(validQuestions, answers)
  const groupName = `${groupPrefix}-q${current}`
  const isLastQuestion = current === total - 1

  return (
    <div className="my-6 rounded-lg border border-border bg-bg-subtle p-4 not-prose space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-fg">{title}</p>
          <p className="text-xs text-fg-muted mt-0.5">
            {showScore ? 'Results' : `Question ${current + 1} of ${total}`}
          </p>
        </div>
        <ProgressDots
          total={total}
          current={current}
          answers={answers}
          questions={validQuestions}
          onJump={handleJump}
        />
      </div>

      {showScore ? (
        <ScoreCard summary={summary} onRetry={handleRetry} />
      ) : currentQuestion !== undefined ? (
        <div className="space-y-4">
          {/* Question text */}
          <p
            id={`${groupPrefix}-q${current}-label`}
            className="text-base font-medium text-fg leading-snug"
          >
            {currentQuestion.text}
          </p>

          {/* Options */}
          <fieldset
            aria-labelledby={`${groupPrefix}-q${current}-label`}
            className="space-y-2 border-none p-0 m-0"
          >
            <legend className="sr-only">{currentQuestion.text}</legend>
            {currentQuestion.options.map((option, i) => (
              <OptionButton
                key={i}
                label={option}
                index={i}
                chosen={chosenIndex === i}
                correct={i === currentQuestion.correctIndex}
                revealed={revealed}
                disabled={revealed}
                groupName={groupName}
                onSelect={handleSelect}
              />
            ))}
          </fieldset>

          {/* Explanation (shown after answering) */}
          {revealed && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-lg border px-4 py-3 text-sm ${
                verdict === 'correct'
                  ? 'border-tip/40 bg-tip-subtle text-fg'
                  : 'border-danger/40 bg-danger-subtle text-fg'
              }`}
            >
              <span className="font-semibold mr-1.5" aria-hidden="true">
                {verdict === 'correct' ? '✓ Correct.' : '✗ Incorrect.'}
              </span>
              <span className="sr-only">
                {verdict === 'correct' ? 'Correct.' : 'Incorrect.'}
              </span>
              {currentQuestion.explanation}
            </div>
          )}

          {/* Navigation row */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
              className="rounded border border-border bg-bg px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-bg-subtle"
              aria-label="Previous question"
            >
              ← Prev
            </button>

            {revealed && (
              <button
                onClick={handleNext}
                className="rounded-lg border border-accent bg-accent-subtle px-4 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-fg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-bg-subtle"
                aria-label={isLastQuestion ? (complete ? 'See results' : 'See results') : 'Next question'}
              >
                {isLastQuestion ? 'See results →' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
