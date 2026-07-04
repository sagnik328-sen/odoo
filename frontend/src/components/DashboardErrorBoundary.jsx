import { Component } from 'react'

class DashboardErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, details) {
    console.error('Dashboard render failed', error, details)
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="mx-auto my-12 max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">Dashboard could not be displayed</h2>
          <p className="mt-2 text-sm text-slate-600">Your session is still safe. Reload the page, and if this continues, sign out and sign in again.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">Reload dashboard</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default DashboardErrorBoundary
