import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DashboardErrorBoundary from './DashboardErrorBoundary'

function BrokenDashboard() {
  throw new Error('broken card')
}

describe('DashboardErrorBoundary', () => {
  it('shows a recovery action instead of a blank application', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<DashboardErrorBoundary><BrokenDashboard /></DashboardErrorBoundary>)

    expect(screen.getByRole('alert')).toHaveTextContent('Dashboard could not be displayed')
    expect(screen.getByRole('button', { name: 'Reload dashboard' })).toBeInTheDocument()
    consoleError.mockRestore()
  })
})
