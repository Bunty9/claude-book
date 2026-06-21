import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Callout } from './Callout'

describe('Callout', () => {
  it('renders children', () => {
    render(<Callout type="warning">Be careful here</Callout>)
    expect(screen.getByText('Be careful here')).toBeInTheDocument()
  })
  it('renders an optional title', () => {
    render(<Callout type="tip" title="Pro tip">do this</Callout>)
    expect(screen.getByText('Pro tip')).toBeInTheDocument()
  })
  it('uses alert role for danger', () => {
    render(<Callout type="danger">stop</Callout>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
  it('defaults to note role when no type given', () => {
    render(<Callout>just a note</Callout>)
    expect(screen.getByRole('note')).toBeInTheDocument()
  })
})
