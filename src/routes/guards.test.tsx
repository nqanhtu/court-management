import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'

import { renderWithRouter } from '@/src/test/test-utils'

const sessionState = vi.hoisted(() => ({
  value: {
    session: null as null | { id: string; username: string; fullName: string; role: string },
    isLoading: false,
  },
}))

vi.mock('@/lib/hooks/use-auth', () => ({
  useSession: () => ({
    session: sessionState.value.session,
    isLoading: sessionState.value.isLoading,
    isAuthenticated: Boolean(sessionState.value.session),
    refreshSession: vi.fn(),
    mutate: vi.fn(),
    logout: vi.fn(),
  }),
}))

import { PermissionRoute, ProtectedRoute } from '@/src/routes/guards'

describe('route guards', () => {
  beforeEach(() => {
    sessionState.value.session = null
    sessionState.value.isLoading = false
  })

  it('redirects unauthenticated users to login', () => {
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/borrow" element={<div>Borrow page</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
      ['/borrow']
    )

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects users without permission to forbidden', () => {
    sessionState.value.session = { id: 'u1', username: 'viewer', fullName: 'Viewer', role: 'VIEWER' }

    renderWithRouter(
      <Routes>
        <Route path="/admin/boxes" element={<PermissionRoute permission="manageStorage"><div>Boxes</div></PermissionRoute>} />
        <Route path="/forbidden" element={<div>Forbidden</div>} />
      </Routes>,
      ['/admin/boxes']
    )

    expect(screen.getByText('Forbidden')).toBeInTheDocument()
  })
})
