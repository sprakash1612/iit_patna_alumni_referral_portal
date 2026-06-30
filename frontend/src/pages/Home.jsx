import { useEffect, useState } from 'react'
import { Plus, X, Loader2, Briefcase, MapPin, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const JOB_TYPES = ['full-time', 'part-time', 'internship', 'remote', 'contract']

const TYPE_COLORS = {
  'full-time':  'bg-green-50 text-green-700 border-green-200',
  'part-time':  'bg-blue-50 text-blue-700 border-blue-200',
  'internship': 'bg-purple-50 text-purple-700 border-purple-200',
  'remote':     'bg-orange-50 text-orange-700 border-orange-200',
  'contract':   'bg-yellow-50 text-yellow-700 border-yellow-200',
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const EMPTY_FORM = { job_title: '', company: '', location: '', job_type: 'full-time', description: '' }

export default function Home() {
  const { user } = useAuth()
  const [posts, setPosts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]       = useState({})
  const [expanded, setExpanded]   = useState({})

  useEffect(() => { fetchPosts() }, [])

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/posts')
      setPosts(data.posts)
    } catch {
      toast.error('Failed to load posts.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post('/posts', form)
      setPosts([data.post, ...posts])
      setForm(EMPTY_FORM)
      setShowForm(false)
      toast.success('Job post published!')
    } catch (err) {
      const res = err.response
      if (res?.status === 422) {
        setErrors(res.data.errors || {})
        toast.error(res.data.message || 'Please fix the errors.')
      } else {
        toast.error('Failed to publish post.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/posts/${id}`)
      setPosts(posts.filter(p => p.id !== id))
      toast.success('Post deleted.')
    } catch {
      toast.error('Failed to delete post.')
    }
  }

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Create Post Button / Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-3 card p-4 text-left hover:border-brand-300 border-2 border-dashed border-gray-200 transition-colors mb-6 rounded-xl"
          >
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Plus size={18} className="text-brand-700" />
            </div>
            <span className="text-gray-400 text-sm">Share a job opening...</span>
          </button>
        ) : (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Post a Job Opening</h3>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}) }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    name="job_title"
                    value={form.job_title}
                    onChange={handleChange}
                    placeholder="Job Title *"
                    className="input"
                    required
                  />
                  {errors.job_title && <p className="error-text">{errors.job_title[0]}</p>}
                </div>
                <div>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Company *"
                    className="input"
                    required
                  />
                  {errors.company && <p className="error-text">{errors.company[0]}</p>}
                </div>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Location (e.g. Bangalore / Remote)"
                  className="input"
                />
                <select
                  name="job_type"
                  value={form.job_type}
                  onChange={handleChange}
                  className="input"
                >
                  {JOB_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                placeholder="Describe the role, requirements, how to apply, referral process..."
                className="input resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">{form.description.length}/2000</p>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-700" size={32} />
          </div>
        ) : posts.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <Briefcase className="mx-auto mb-3" size={40} />
            <p className="font-medium">No job posts yet</p>
            <p className="text-sm mt-1">Be the first to share an opening!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="card">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-base">{post.job_title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[post.job_type] || TYPE_COLORS['full-time']}`}>
                        {post.job_type}
                      </span>
                    </div>
                    <p className="text-brand-700 font-semibold text-sm mt-0.5">{post.company}</p>
                    <div className="flex items-center gap-3 mt-1 text-gray-400 text-xs flex-wrap">
                      {post.location && (
                        <span className="flex items-center gap-1"><MapPin size={11} />{post.location}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                  {post.posted_by.id === user?.id && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Delete post"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Posted by */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
                    {post.posted_by.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{post.posted_by.name}</p>
                    {(post.posted_by.designation || post.posted_by.current_company) && (
                      <p className="text-xs text-gray-400">
                        {post.posted_by.designation}{post.posted_by.current_company ? ` @ ${post.posted_by.current_company}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {post.description && (
                  <div>
                    <p className={`text-sm text-gray-600 whitespace-pre-line ${!expanded[post.id] && post.description.length > 200 ? 'line-clamp-3' : ''}`}>
                      {post.description}
                    </p>
                    {post.description.length > 200 && (
                      <button
                        onClick={() => toggleExpand(post.id)}
                        className="text-xs text-brand-700 hover:underline mt-1 flex items-center gap-0.5"
                      >
                        {expanded[post.id] ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
