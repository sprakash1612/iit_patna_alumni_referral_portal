import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Register from './pages/Register'
import Login from './pages/Login'
import VerifyOtp from './pages/VerifyOtp'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Referrals from './pages/Referrals'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Admin from './pages/Admin'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-800" />
  </div>
)

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/home" replace /> : children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/verify-otp" element={<GuestRoute><VerifyOtp /></GuestRoute>} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
    </Routes>
  )
}
