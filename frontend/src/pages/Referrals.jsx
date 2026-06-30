import { useEffect, useState } from 'react'
import { Loader2, SendHorizontal, Inbox, Briefcase, Mail, Phone, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import SkillBadge from '../components/SkillBadge'
import api from '../api/axios'

const STATUS_COLORS = {
  sent:     'text-blue-600 bg-blue-50 border-blue-200',
  pending:  'text-yellow-600 bg-yellow-50 border-yellow-200',
  accepted: 'text-green-600 bg-green-50 border-green-200',
  rejected: 'text-red-600 bg-red-50 border-red-200',
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ReceivedCard({ req }) {
  const r = req.requester
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{r.name}</p>
          {r.designation && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
              <Briefcase size={13} />
              {r.designation}{r.current_company ? ` @ ${r.current_company}` : ''}
            </p>
          )}
          {r.total_experience && <p className="text-gray-400 text-xs mt-0.5">Experience: {r.total_experience}</p>}
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg border ${STATUS_COLORS[req.status] || STATUS_COLORS.sent}`}>
          {req.status}
        </span>
      </div>

      <div className="text-xs space-y-1 text-gray-500">
        <p className="flex items-center gap-1.5"><Mail size={12} /> {r.college_email}</p>
        {r.personal_email && <p className="flex items-center gap-1.5"><Mail size={12} /> {r.personal_email}</p>}
        {r.mobile && <p className="flex items-center gap-1.5"><Phone size={12} /> {r.mobile}</p>}
      </div>

      {req.message && (
        <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">"{req.message}"</p>
      )}

      <p className="text-xs text-gray-300 flex items-center gap-1"><Clock size={11} />{formatDate(req.created_at)}</p>
    </div>
  )
}

function SentCard({ req }) {
  const r = req.referee
  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{r.name}</p>
          {r.designation && (
            <p className="text-gray-500 text-sm">{r.designation}{r.current_company ? ` @ ${r.current_company}` : ''}</p>
          )}
          <p className="text-gray-400 text-xs">{r.college_email}</p>
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg border ${STATUS_COLORS[req.status] || STATUS_COLORS.sent}`}>
          {req.status}
        </span>
      </div>
      {req.message && (
        <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">"{req.message}"</p>
      )}
      <p className="text-xs text-gray-300 flex items-center gap-1"><Clock size={11} />{formatDate(req.created_at)}</p>
    </div>
  )
}

export default function Referrals() {
  const [tab, setTab]         = useState('received')
  const [received, setReceived] = useState([])
  const [sent, setSent]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/referrals/received'),
      api.get('/referrals/sent'),
    ]).then(([r, s]) => {
      setReceived(r.data.requests)
      setSent(s.data.requests)
    }).catch(() => toast.error('Failed to load referrals.'))
      .finally(() => setLoading(false))
  }, [])

  const tabs = [
    { key: 'received', label: 'Received', icon: Inbox,          count: received.length },
    { key: 'sent',     label: 'Sent',     icon: SendHorizontal,  count: sent.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Referral Requests</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-white text-brand-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-700" size={32} />
          </div>
        ) : tab === 'received' ? (
          received.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <Inbox className="mx-auto mb-3" size={40} />
              <p className="font-medium">No requests received yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {received.map(r => <ReceivedCard key={r.id} req={r} />)}
            </div>
          )
        ) : (
          sent.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <SendHorizontal className="mx-auto mb-3" size={40} />
              <p className="font-medium">No requests sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sent.map(r => <SentCard key={r.id} req={r} />)}
            </div>
          )
        )}
      </div>
    </div>
  )
}
