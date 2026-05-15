import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AppLayout from './components/Layout'
import Dashboard from './pages/app/Dashboard'
import Employees from './pages/app/Employees'
import Shifts from './pages/app/Shifts'
import TimeOff from './pages/app/TimeOff'
import Branches from './pages/app/Branches'
import Departments from './pages/app/Departments'
import AISchedule from './pages/app/AISchedule'
import Reports from './pages/app/Reports'
import Settings from './pages/app/Settings'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/app" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="shifts" element={<Shifts />} />
        <Route path="time-off" element={<TimeOff />} />
        <Route path="branches" element={<Branches />} />
        <Route path="departments" element={<Departments />} />
        <Route path="schedule" element={<AISchedule />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}