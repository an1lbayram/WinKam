import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children as accessible button text', () => {
    render(<Button>Temizle</Button>)
    expect(screen.getByRole('button', { name: 'Temizle' })).toBeInTheDocument()
  })

  it('applies the primary variant classes by default', () => {
    render(<Button>Go</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-violet-600')
  })

  it('applies the danger variant when requested', () => {
    render(<Button variant="danger">Sil</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-rose-600')
  })

  it('applies size classes', () => {
    render(<Button size="lg">Big</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-11')
  })

  it('merges a custom className without dropping base styles', () => {
    render(<Button className="custom-class">X</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('custom-class')
    expect(btn).toHaveClass('inline-flex')
  })

  it('is disabled and unclickable when disabled prop is set', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Button disabled onClick={onClick}>
        Locked
      </Button>,
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('fires onClick when enabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Run</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is keyboard-activatable (accessibility: native button semantics)', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Focusable</Button>)
    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
