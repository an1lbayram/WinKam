import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'

describe('Card composition', () => {
  it('renders title, description and content together', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Temizlik</CardTitle>
          <CardDescription>Safe ile başla</CardDescription>
        </CardHeader>
        <CardContent>Gövde metni</CardContent>
      </Card>,
    )

    expect(screen.getByText('Temizlik')).toBeInTheDocument()
    expect(screen.getByText('Safe ile başla')).toBeInTheDocument()
    expect(screen.getByText('Gövde metni')).toBeInTheDocument()
  })

  it('merges custom className on the outer Card', () => {
    const { container } = render(<Card className="col-span-2">x</Card>)
    expect(container.firstChild).toHaveClass('col-span-2')
    expect(container.firstChild).toHaveClass('rounded-2xl')
  })

  it('forwards arbitrary props (e.g. data-testid) to underlying divs', () => {
    render(<Card data-testid="my-card">content</Card>)
    expect(screen.getByTestId('my-card')).toBeInTheDocument()
  })
})
