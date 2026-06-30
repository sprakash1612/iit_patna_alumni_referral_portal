import { useEffect, useState } from 'react'
import { Plus, X, Loader2, Briefcase, MapPin, Clock, Trash2, ChevronDown, ChevronUp, SendHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const JOB_TYPES = ['full-time', 'part-time', 'internship', 'remote', 'contract']
const TYPE_COLORS = {
  'full-time': 'bg-green-50 text-green-700 border-green-200',
  'part-time': 'bg-blue-50 text-blue-700 border-blue-200',
  'internship': 'bg-purple-50 text-purple-700 border-purple-200',
  'remote': 'bg-orange-50 text-orange-700 border-orange-200',
  'contract': 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  if (s < 604800) return `${Math.floor(s/86400)}d ago`
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

const EMPTY = { job_title:'', company:'', location:'', job_type:'full-time', description:'' }

export default function Home() {
  const { user }              = useAuth()
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]   = useState({})
  const [expanded, setExpanded] = useState({})
  const [sentPostIds, setSentPostIds] = useState(new Set())
  const [modal, setModal]     = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('job_posts')
        .select(`id, job_title, company, location, job_type, description, created_at,
                 posted_by:profiles!user_id(id, name, college_email, designation, current_company)`)
        .order('created_at', { ascending: false }),
      supabase.from('referral_requests')
        .select('job_post_id')
        .eq('requester_id', user.id)
        .not('job_post_id', 'is', null),
    ]).then(([{ data: postsData }, { data: sentData }]) => {
      setPosts(postsData || [])
      setSentPostIds(new Set((sentData || []).map(r => r.job_post_id)))
    }).catch(() => toast.error('Failed to load posts.'))
      .finally(() => setLoading(false))
  }, [user])

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setErrors({ ...errors, [e.target.name]: '' }) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { data, error } = await supabase.from('job_posts').insert({
        user_id: user.id, ...form,
      }).select(`id, job_title, company, location, job_type, description, created_at,
                 posted_by:profiles!user_id(id, name, college_email, designation, current_company)`).single()
      if (error) { toast.error(error.message); return }
      setPosts([data, ...posts]); setForm(EMPTY); setShowForm(false)
      toast.success('Job post published!')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('job_posts').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setPosts(posts.filter(p => p.id !== id)); toast.success('Post deleted.')
  }

  const openModal  = (poster) => { setModal(poster); setMessage('') }
  const closeModal = () => { setModal(null); setMessage('') }

  const sendReferral = async () => {
    setSending(true)
    try {
      const { error } = await supabase.from('referral_requests').insert({
        requester_id: user.id, referee_id: modal.id,
        job_post_id: modal.post_id, message: message.trim() || null,
        status: 'sent', is_seen: false,
      })
      if (error) { toast.error(error.message); return }
      toast.success(`Referral request sent to ${modal.name}!`)
      setSentPostIds(prev => new Set([...prev, modal.post_id]))
      const subject = encodeURIComponent('Referral Request — IITP Alumni Network')
      const body = encodeURIComponent(
        `Hi ${modal.name},\n\nI am ${user.name}, an IIT Patna alumnus. I saw your job post for "${modal.job_title}" at ${modal.company} on the IITP Referral Portal and would like to request a referral.\n\n` +
        (message.trim() ? `${message.trim()}\n\n` : '') +
        `My profile:\n• ${user.college_email}\n` +
        (user.designation ? `• ${user.designation}${user.current_company ? ` @ ${user.current_company}` : ''}\n` : '') +
        (user.total_experience ? `• Experience: ${user.total_experience}\n` : '') +
        `\nBest regards,\n${user.name}`
      )
      window.open(`mailto:${modal.college_email}?subject=${subject}&body=${body}`)
      closeModal()
    } finally { setSending(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-3 p-4 text-left hover:border-brand-300 border-2 border-dashed border-gray-200 bg-white rounded-xl transition-colors mb-6">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Plus size={18} className="text-brand-700" />
            </div>
            <span className="text-gray-400 text-sm">Share a job opening...</span>
          </button>
        ) : (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Post a Job Opening</h3>
              <button onClick={() => { setShowForm(false); setForm(EMPTY); setErrors({}) }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input name="job_title" value={form.job_title} onChange={handleChange} placeholder="Job Title *" className="input" required />
                  {errors.job_title && <p className="error-text">{errors.job_title[0]}</p>}
                </div>
                <div>
                  <input name="company" value={form.company} onChange={handleChange} placeholder="Company *" className="input" required />
                  {errors.company && <p className="error-text">{errors.company[0]}</p>}
                </div>
                <input name="location" value={form.location} onChange={handleChange} placeholder="Location (e.g. Bangalore / Remote)" className="input" />
                <select name="job_type" value={form.job_type} onChange={handleChange} className="input">
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} maxLength={2000}
                placeholder="Describe the role, requirements, how to apply..." className="input resize-none" />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">{form.description.length}/2000</p>
                <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Publishing...' : 'Publish'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-700" size={32} /></div>
        ) : posts.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <Briefcase className="mx-auto mb-3" size={40} />
            <p className="font-medium">No job posts yet</p>
            <p className="text-sm mt-1">Be the first to share an opening!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const isOwn = post.posted_by?.id === user?.id
              const sent  = sentPostIds.has(post.id)
              return (
                <div key={post.id} className="card">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{post.job_title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[post.job_type] || TYPE_COLORS['full-time']}`}>{post.job_type}</span>
                      </div>
                      <p className="text-brand-700 font-semibold text-sm mt-0.5">{post.company}</p>
                      <div className="flex items-center gap-3 mt-1 text-gray-400 text-xs flex-wrap">
                        {post.location && <span className="flex items-center gap-1"><MapPin size={11}/>{post.location}</span>}
                        <span className="flex items-center gap-1"><Clock size={11}/>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                    {isOwn && <button onClick={() => handleDelete(post.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 size={16}/></button>}
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
                        {(post.posted_by?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{post.posted_by?.name}</p>
                        {(post.posted_by?.designation || post.posted_by?.current_company) && (
                          <p className="text-xs text-gray-400">{post.posted_by.designation}{post.posted_by.current_company ? ` @ ${post.posted_by.current_company}` : ''}</p>
                        )}
                      </div>
                    </div>
                    {!isOwn && (
                      sent ? (
                        <span className="flex-shrink-0 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">✓ Request Sent</span>
                      ) : (
                        <button onClick={() => openModal({ ...post.posted_by, post_id: post.id, job_title: post.job_title, company: post.company })}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-800 hover:bg-brand-700 rounded-lg transition-colors">
                          <SendHorizontal size={13}/>Ask Referral
                        </button>
                      )
                    )}
                  </div>
                  {post.description && (
                    <div>
                      <p className={`text-sm text-gray-600 whitespace-pre-line ${!expanded[post.id] && post.description.length > 200 ? 'line-clamp-3' : ''}`}>{post.description}</p>
                      {post.description.length > 200 && (
                        <button onClick={() => setExpanded(p => ({ ...p, [post.id]: !p[post.id] }))} className="text-xs text-brand-700 hover:underline mt-1 flex items-center gap-0.5">
                          {expanded[post.id] ? <><ChevronUp size={13}/>Show less</> : <><ChevronDown size={13}/>Read more</>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal}/>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ask for Referral</h3>
                <p className="text-sm text-gray-500 mt-0.5">For <span className="font-semibold text-gray-700">{modal.job_title}</span> @ {modal.company}</p>
                <p className="text-sm text-gray-400 mt-0.5">via <span className="font-medium">{modal.name}</span></p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Your Profile (shared with referee)</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.college_email}</p>
              {user?.personal_email && <p className="text-gray-500 text-sm">{user.personal_email}</p>}
              {user?.designation && <p className="text-gray-600 text-sm mt-1">{user.designation}{user.current_company ? ` @ ${user.current_company}` : ''}</p>}
              {user?.total_experience && <p className="text-gray-400 text-xs mt-0.5">Experience: {user.total_experience}</p>}
              {user?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.skills.slice(0, 5).map(s => <span key={s} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{s}</span>)}
                  {user.skills.length > 5 && <span className="text-xs text-blue-400">+{user.skills.length - 5} more</span>}
                </div>
              )}
            </div>
            <div className="mb-5">
              <label className="label">Personal Message <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={1000}
                placeholder="Hi! I'm interested in the position you posted..." className="input resize-none"/>
              <p className="text-xs text-gray-400 text-right mt-1">{message.length}/1000</p>
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button onClick={sendReferral} disabled={sending} className="btn-primary flex-1">
                <SendHorizontal size={16}/>{sending ? 'Sending...' : 'Send Request & Open Mail'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
