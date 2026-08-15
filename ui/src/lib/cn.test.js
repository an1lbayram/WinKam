import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins plain string classes', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 0, '', 'b')).toBe('a b')
  })

  it('merges conflicting tailwind classes, keeping the last one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('supports conditional object syntax via clsx', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })

  it('returns empty string for no meaningful input', () => {
    expect(cn()).toBe('')
    expect(cn(false, null, undefined)).toBe('')
  })
})
