import { LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
  }

  return (
    <nav className="bg-brand-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-brand-800 font-bold text-sm">II</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">IITP Referral Portal</p>
              <p className="text-blue-200 text-xs leading-tight">IIT Patna Alumni Network</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-blue-100 text-sm">
              <User size={16} />
              <span className="font-medium">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-blue-100 hover:text-white hover:bg-brand-700 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
