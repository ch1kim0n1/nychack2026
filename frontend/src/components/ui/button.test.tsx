import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeDisabled()
  })
})
