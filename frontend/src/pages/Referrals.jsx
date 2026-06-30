import { useEffect, useState } from 'react'
import { Loader2, SendHorizontal, Inbox, Briefcase, Mail, Phone, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const STATUS_COLORS = {
  sent:     'text-blue-600 bg-blue-50 border-blue-200',
  pending:  'text-yellow-600 bg-yellow-50 border-yellow-200',
  accepted: 'text-green-600 bg-green-50 border-green-200',
  rejected: 'text-red-600 bg-red-50 border-red-200',
}

function fmt(d) {
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

export default function Referrals() {
  const { user }              = useAuth()
  const [tab, setTab]         = useState('received')
  const [received, setReceived] = useState([])
  const [sent, setSent]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('referral_requests')
        .select(`id, job_post_id, message, status, is_seen, created_at,
                 requester:profiles!requester_id(
                   id, name, college_email, personal_email, mobile, show_mobile,
                   current_company, designation, total_experience
                 )`)
        .eq('referee_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('referral_requests')
        .select(`id, job_post_id, message, status, created_at,
                 referee:profiles!referee_id(id, name, college_email, current_company, designation)`)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: rec }, { data: snt }]) => {
      setReceived(rec || [])
      setSent(snt || [])
    }).catch(() => toast.error('Failed to load referrals.'))
      .finally(() => setLoading(false))
  }, [user])

  const tabs = [
    { key: 'received', label: 'Received', icon: Inbox,         count: received.length },
    { key: 'sent',     label: 'Sent',     icon: SendHorizontal, count: sent.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Referral Requests</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={15}/>{label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-700" size={32}/></div>
        ) : tab === 'received' ? (
          received.length === 0 ? (
            <div className="card text-center py-16 text-gray-400"><Inbox className="mx-auto mb-3" size={40}/><p className="font-medium">No requests received yet</p></div>
          ) : (
            <div className="space-y-3">
              {received.map(r => (
                <div key={r.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{r.requester.name}</p>
                      {r.requester.designation && (
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                          <Briefcase size={13}/>{r.requester.designation}{r.requester.current_company ? ` @ ${r.requester.current_company}` : ''}
                        </p>
                      )}
                      {r.requester.total_experience && <p className="text-gray-400 text-xs mt-0.5">Experience: {r.requester.total_experience}</p>}
                    </div>
                    <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg border ${STATUS_COLORS[r.status] || STATUS_COLORS.sent}`}>{r.status}</span>
                  </div>
                  <div className="text-xs space-y-1 text-gray-500">
                    <p className="flex items-center gap-1.5"><Mail size={12}/>{r.requester.college_email}</p>
                    {r.requester.personal_email && <p className="flex items-center gap-1.5"><Mail size={12}/>{r.requester.personal_email}</p>}
                    {r.requester.mobile && <p className="flex items-center gap-1.5"><Phone size={12}/>{r.requester.show_mobile ? r.requester.mobile : '••••••••'}</p>}
                  </div>
                  {r.job_post_id && <p className="text-xs text-purple-600 font-medium">Via job post</p>}
                  {r.message && <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">"{r.message}"</p>}
                  <p className="text-xs text-gray-300 flex items-center gap-1"><Clock size={11}/>{fmt(r.created_at)}</p>
                </div>
              ))}
            </div>
          )
        ) : (
          sent.length === 0 ? (
            <div className="card text-center py-16 text-gray-400"><SendHorizontal className="mx-auto mb-3" size={40}/><p className="font-medium">No requests sent yet</p></div>
          ) : (
            <div className="space-y-3">
              {sent.map(r => (
                <div key={r.id} className="card space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{r.referee.name}</p>
                      {r.referee.designation && <p className="text-gray-500 text-sm">{r.referee.designation}{r.referee.current_company ? ` @ ${r.referee.current_company}` : ''}</p>}
                      <p className="text-gray-400 text-xs">{r.referee.college_email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg border ${STATUS_COLORS[r.status] || STATUS_COLORS.sent}`}>{r.status}</span>
                      {r.job_post_id && <span className="text-xs text-purple-500">Via job post</span>}
                    </div>
                  </div>
                  {r.message && <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">"{r.message}"</p>}
                  <p className="text-xs text-gray-300 flex items-center gap-1"><Clock size={11}/>{fmt(r.created_at)}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <Footer />
    </div>
  )
}
