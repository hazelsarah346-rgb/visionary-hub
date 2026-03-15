import React, { Component } from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e, info) { console.error('App error:', e, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#050F1E', color: '#EFF6FF', padding: 24, fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#EF4444' }}>Something went wrong</h1>
          <pre style={{ background: '#091525', padding: 16, borderRadius: 8, overflow: 'auto' }}>{this.state.error?.message || String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
