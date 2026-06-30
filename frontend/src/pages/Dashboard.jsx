import { useState, useEffect } from 'react'
import { Search, SendHorizontal, X, Loader2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import SkillBadge from '../components/SkillBadge'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Dashboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState(null) // { user }
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sentIds, setSentIds] = useState(new Set())

  useEffect(() => {
    fetchUsers()
    fetchSentRequests()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.designation || '').toLowerCase().includes(q) ||
        (u.current_company || '').toLowerCase().includes(q) ||
        u.skills.some(s => s.toLowerCase().includes(q))
      )
    )
  }, [search, users])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users')
      setUsers(data.users)
      setFiltered(data.users)
    } catch {
      toast.error('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSentRequests = async () => {
    try {
      const { data } = await api.get('/referrals/sent')
      setSentIds(new Set(data.requests.map(r => r.referee_id)))
    } catch {}
  }

  const openModal = (targetUser) => {
    setModal(targetUser)
    setMessage('')
  }

  const closeModal = () => {
    setModal(null)
    setMessage('')
  }

  const sendReferral = async () => {
    setSending(true)
    try {
      const { data } = await api.post('/referrals', {
        referee_id: modal.id,
        message: message.trim() || null,
      })
      toast.success(data.message)
      setSentIds(prev => new Set([...prev, modal.id]))

      // Open mailto so the user can also send a personal email directly
      const subject = encodeURIComponent('Referral Request — IITP Alumni Network')
      const body = encodeURIComponent(
        `Hi ${modal.name},\n\n` +
        `I am ${user?.name}, an IIT Patna alumnus. I came across your profile on the IITP Referral Portal ` +
        `and would like to request a referral${modal.current_company ? ` at ${modal.current_company}` : ''}.\n\n` +
        (message.trim() ? `${message.trim()}\n\n` : '') +
        `My profile:\n` +
        `• College Email: ${user?.college_email}\n` +
        (user?.designation ? `• Designation: ${user.designation}\n` : '') +
        (user?.current_company ? `• Current Company: ${user.current_company}\n` : '') +
        (user?.total_experience ? `• Experience: ${user.total_experience}\n` : '') +
        `\nLooking forward to hearing from you.\n\nBest regards,\n${user?.name}`
      )
      const to = modal.college_email
      window.open(`mailto:${to}?subject=${subject}&body=${body}`)

      closeModal()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand-800 to-brand-600 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-xl font-bold">Welcome, {user?.name}!</h2>
          <p className="text-blue-100 text-sm mt-1">
            Connect with your IIT Patna peers and grow your career through referrals.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, designation, or skill..."
              className="input pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={16} />
            <span>{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-700" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Users className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No members found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Name</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Designation</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Current Company</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Experience</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Personal Email</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Mobile</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Skills</th>
                      <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <p className="text-gray-400 text-xs">{u.college_email}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-700">{u.designation || '—'}</td>
                        <td className="px-5 py-4 text-gray-700">
                          <p>{u.current_company || '—'}</p>
                          {u.previous_company?.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">Prev: {u.previous_company.join(', ')}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-700">{u.total_experience || '—'}</td>
                        <td className="px-5 py-4 text-gray-700 text-xs">{u.personal_email || '—'}</td>
                        <td className="px-5 py-4 text-gray-700 text-xs">
                          {u.mobile
                            ? u.show_mobile
                              ? u.mobile
                              : <span className="text-gray-400 tracking-widest">{u.mobile}</span>
                            : '—'
                          }
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.skills.length > 0
                              ? u.skills.slice(0, 3).map(s => <SkillBadge key={s} skill={s} />)
                              : <span className="text-gray-400">—</span>
                            }
                            {u.skills.length > 3 && (
                              <span className="text-xs text-gray-400">+{u.skills.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {sentIds.has(u.id) ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
                              Request Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => openModal(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-800 hover:bg-brand-700 rounded-lg transition-colors"
                            >
                              <SendHorizontal size={13} />
                              Ask Referral
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(u => (
                <div key={u.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      <p className="text-gray-500 text-xs">{u.college_email}</p>
                      {u.designation && <p className="text-gray-600 text-sm mt-1">{u.designation} {u.current_company ? `@ ${u.current_company}` : ''}</p>}
                      {u.previous_company?.length > 0 && <p className="text-gray-400 text-xs mt-0.5">Prev: {u.previous_company.join(', ')}</p>}
                      {u.total_experience && <p className="text-gray-500 text-xs mt-0.5">Exp: {u.total_experience}</p>}
                      {u.personal_email && <p className="text-gray-500 text-xs mt-0.5">{u.personal_email}</p>}
                      {u.mobile && <p className="text-gray-500 text-xs mt-0.5">📱 {u.mobile}</p>}
                    </div>
                    {sentIds.has(u.id) ? (
                      <span className="flex-shrink-0 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">Sent</span>
                    ) : (
                      <button
                        onClick={() => openModal(u)}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-brand-800 hover:bg-brand-700 rounded-lg"
                      >
                        <SendHorizontal size={12} />
                        Ask
                      </button>
                    )}
                  </div>
                  {u.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {u.skills.map(s => <SkillBadge key={s} skill={s} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Referral Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ask for Referral</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Requesting from <span className="font-semibold text-gray-700">{modal.name}</span>
                  {modal.current_company ? ` @ ${modal.current_company}` : ''}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Your profile — shared with referee */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Your Profile (shared with referee)</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.college_email}</p>
              {user?.personal_email && <p className="text-gray-500 text-sm">{user.personal_email}</p>}
              {user?.designation && (
                <p className="text-gray-600 text-sm mt-1">
                  {user.designation}{user.current_company ? ` @ ${user.current_company}` : ''}
                </p>
              )}
              {user?.total_experience && <p className="text-gray-400 text-xs mt-0.5">Experience: {user.total_experience}</p>}
              {user?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.skills.slice(0, 5).map(s => (
                    <span key={s.name ?? s} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {s.name ?? s}
                    </span>
                  ))}
                  {user.skills.length > 5 && <span className="text-xs text-blue-400">+{user.skills.length - 5} more</span>}
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="label">Personal Message <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Hi! I'm interested in opportunities at your company..."
                className="input resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{message.length}/1000</p>
            </div>

            <div className="flex gap-3">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={sendReferral} disabled={sending} className="btn-primary flex-1">
                <SendHorizontal size={16} />
                {sending ? 'Sending...' : 'Send Request & Open Mail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
