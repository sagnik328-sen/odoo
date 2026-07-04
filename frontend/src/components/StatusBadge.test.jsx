import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the supplied attendance state with its semantic color', () => {
    render(<StatusBadge status="Present" />)

    expect(screen.getByText('Present')).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('falls back safely for a new or unknown state', () => {
    render(<StatusBadge status="Remote" />)

    expect(screen.getByText('Remote')).toHaveClass('bg-gray-100', 'text-gray-800')
  })
})
