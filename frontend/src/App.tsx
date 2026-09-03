import { Routes, Route, NavLink } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import NewAuthorizationPage from './pages/NewAuthorizationPage'
import AuthorizationDetailPage from './pages/AuthorizationDetailPage'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="topbar-brand">ABC Healthcare</div>
          <div className="topbar-sub">Prior Authorization System</div>
        </div>
        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/new" className={({ isActive }) => isActive ? 'active' : ''}>
            + New Request
          </NavLink>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/new" element={<NewAuthorizationPage />} />
          <Route path="/authorization/:id" element={<AuthorizationDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}
