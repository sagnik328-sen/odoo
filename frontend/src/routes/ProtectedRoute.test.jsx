import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'

function renderRoute() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<p>Login screen</p>} />
          <Route path="/unauthorized" element={<p>Unauthorized screen</p>} />
          <Route path="/private" element={<ProtectedRoute allowedRoles={['hr']}><p>Private screen</p></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects an anonymous visitor to login', async () => {
    renderRoute()
    expect(await screen.findByText('Login screen')).toBeInTheDocument()
  })

  it('renders content for an authenticated user with an allowed role', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'hr' }))
    renderRoute()

    await waitFor(() => expect(screen.getByText('Private screen')).toBeInTheDocument())
  })

  it('redirects an authenticated user with the wrong role', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'employee' }))
    renderRoute()

    expect(await screen.findByText('Unauthorized screen')).toBeInTheDocument()
  })
})
