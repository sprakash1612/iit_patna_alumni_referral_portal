import { useEffect, useRef, useState } from 'react'
import { LogOut, User, Bell, X, Briefcase, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/referrals/received')
      setNotifications(data.requests)
    } catch {}
  }

  const handleBellClick = async () => {
    setOpen(prev => !prev)
    const unseen = notifications.filter(n => !n.is_seen)
    if (!open && unseen.length > 0) {
      try {
        await api.patch('/referrals/mark-seen')
        setNotifications(prev => prev.map(n => ({ ...n, is_seen: true })))
      } catch {}
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
  }

  const unseenCount = notifications.filter(n => !n.is_seen).length

  return (
    <nav className="bg-brand-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-brand-800 font-bold text-sm">II</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">IITP Referral Portal</p>
              <p className="text-blue-200 text-xs leading-tight">IIT Patna Alumni Network</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 text-blue-100 hover:text-white text-sm mr-1 transition-colors"
            >
              <User size={16} />
              <span className="font-medium">{user?.name}</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleBellClick}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-blue-100 hover:text-white hover:bg-brand-700 transition-colors"
              >
                <Bell size={18} />
                {unseenCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {unseenCount > 9 ? '9+' : unseenCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-800 text-sm">Referral Requests Received</h4>
                    <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                      No referral requests yet
                    </div>
                  ) : (
                    <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                      {notifications.map(n => (
                        <li key={n.id} className={`px-4 py-3 ${!n.is_seen ? 'bg-blue-50' : ''}`}>
                          <div className="flex items-start gap-2">
                            {!n.is_seen && (
                              <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">{n.requester.name}</p>
                              {n.requester.designation && (
                                <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                  <Briefcase size={11} />
                                  {n.requester.designation}{n.requester.current_company ? ` @ ${n.requester.current_company}` : ''}
                                </p>
                              )}
                              {n.requester.college_email && (
                                <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                  <Mail size={11} />
                                  {n.requester.college_email}
                                </p>
                              )}
                              {n.requester.mobile && (
                                <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                  <Phone size={11} />
                                  {n.requester.mobile}
                                </p>
                              )}
                              {n.message && (
                                <p className="text-gray-600 text-xs mt-1.5 italic border-l-2 border-gray-200 pl-2">
                                  "{n.message}"
                                </p>
                              )}
                              <p className="text-gray-300 text-[10px] mt-1">
                                {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
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
