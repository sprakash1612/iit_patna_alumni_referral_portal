import { useEffect, useState } from 'react'
import { Users, Briefcase, SendHorizontal, Trash2, Loader2, ShieldCheck, ShieldOff, UserCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function fmt(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Admin() {
  const [tab, setTab]             = useState('users')
  const [users, setUsers]         = useState([])
  const [posts, setPosts]         = useState([])
  const [referrals, setReferrals] = useState([])
  const [guestReqs, setGuestReqs] = useState([])
  const [loading, setLoading]     = useState(true)
  const [stats, setStats]         = useState({})

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [
      { data: usersData },
      { data: postsData },
      { data: referralsData },
      { data: guestData },
    ] = await Promise.all([
      supabase.from('profiles')
        .select('id, name, college_email, personal_email, designation, current_company, is_verified, is_admin, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('job_posts')
        .select('id, job_title, company, job_type, created_at, posted_by:profiles!user_id(name, college_email)')
        .order('created_at', { ascending: false }),
      supabase.from('referral_requests')
        .select(`id, message, status, job_post_id, created_at,
                 requester:profiles!requester_id(name, college_email),
                 referee:profiles!referee_id(name, college_email)`)
        .order('created_at', { ascending: false }),
      supabase.from('guest_referral_requests')
        .select(`id, guest_name, guest_email, guest_mobile, message, job_post_id, created_at,
                 referee:profiles!referee_id(name, college_email, current_company)`)
        .order('created_at', { ascending: false }),
    ])
    setUsers(usersData || [])
    setPosts(postsData || [])
    setReferrals(referralsData || [])
    setGuestReqs(guestData || [])
    setStats({
      users:     (usersData || []).length,
      posts:     (postsData || []).length,
      referrals: (referralsData || []).length,
      guests:    (guestData || []).length,
    })
    setLoading(false)
  }

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setUsers(users.filter(u => u.id !== id))
    setStats(s => ({ ...s, users: s.users - 1 }))
    toast.success(`${name} deleted.`)
  }

  const toggleVerified = async (id, current) => {
    const { error } = await supabase.from('profiles').update({ is_verified: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setUsers(users.map(u => u.id === id ? { ...u, is_verified: !current } : u))
    toast.success(current ? 'User unverified.' : 'User verified.')
  }

  const toggleAdmin = async (id, current, name) => {
    if (current && !confirm(`Remove admin from ${name}?`)) return
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setUsers(users.map(u => u.id === id ? { ...u, is_admin: !current } : u))
    toast.success(current ? 'Admin removed.' : `${name} is now an admin.`)
  }

  const deletePost = async (id) => {
    if (!confirm('Delete this job post?')) return
    const { error } = await supabase.from('job_posts').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setPosts(posts.filter(p => p.id !== id))
    setStats(s => ({ ...s, posts: s.posts - 1 }))
    toast.success('Post deleted.')
  }

  const tabs = [
    { key: 'users',    label: 'Users',          icon: Users,          count: stats.users },
    { key: 'posts',    label: 'Job Posts',       icon: Briefcase,      count: stats.posts },
    { key: 'referrals',label: 'Referrals',       icon: SendHorizontal, count: stats.referrals },
    { key: 'guests',   label: 'Guest Requests',  icon: UserCircle,     count: stats.guests },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage users, posts and referral requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Users}          label="Total Members"   value={stats.users}    color="bg-brand-700" />
          <StatCard icon={Briefcase}      label="Job Posts"       value={stats.posts}    color="bg-purple-600" />
          <StatCard icon={SendHorizontal} label="Referral Requests" value={stats.referrals} color="bg-green-600" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={15} />{label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-500'}`}>
                {count ?? 0}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-700" size={32} /></div>
        ) : (

          /* ── USERS ── */
          tab === 'users' ? (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Designation</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Verified</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Admin</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-gray-400 text-xs">{u.college_email}</p>
                          {u.personal_email && <p className="text-gray-400 text-xs">{u.personal_email}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {u.designation || '—'}
                          {u.current_company && <p className="text-gray-400">{u.current_company}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(u.created_at)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleVerified(u.id, u.is_verified)}
                            title={u.is_verified ? 'Click to unverify' : 'Click to verify'}
                            className={`text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
                              u.is_verified ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100' : 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                            }`}>
                            {u.is_verified ? 'Verified' : 'Unverified'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleAdmin(u.id, u.is_admin, u.name)}
                            title={u.is_admin ? 'Remove admin' : 'Make admin'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.is_admin ? 'text-brand-700 bg-brand-50 hover:bg-brand-100' : 'text-gray-400 hover:text-brand-700 hover:bg-brand-50'
                            }`}>
                            {u.is_admin ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => deleteUser(u.id, u.name)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          /* ── JOB POSTS ── */
          ) : tab === 'posts' ? (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Job Title</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Posted By</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {posts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.job_title}</p>
                          <p className="text-gray-400 text-xs">{p.company}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700">{p.posted_by?.name}</p>
                          <p className="text-gray-400 text-xs">{p.posted_by?.college_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{p.job_type}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(p.created_at)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => deletePost(p.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          /* ── REFERRALS ── */
          ) : tab === 'referrals' ? (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Requester</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Referee</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Message</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Type</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referrals.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{r.requester?.name}</p>
                          <p className="text-gray-400 text-xs">{r.requester?.college_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{r.referee?.name}</p>
                          <p className="text-gray-400 text-xs">{r.referee?.college_email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                          {r.message || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.job_post_id ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                            {r.job_post_id ? 'Job Post' : 'Direct'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
          /* ── GUEST REQUESTS ── */
            guestReqs.length === 0 ? (
              <div className="card text-center py-16 text-gray-400">
                <UserCircle className="mx-auto mb-3" size={40} />
                <p className="font-medium">No guest requests yet</p>
              </div>
            ) : (
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Guest</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Requested From</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Message</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Type</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {guestReqs.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{r.guest_name}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 space-y-0.5">
                            <p>{r.guest_email}</p>
                            {r.guest_mobile && <p className="text-gray-400">{r.guest_mobile}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{r.referee?.name}</p>
                            <p className="text-gray-400 text-xs">{r.referee?.college_email}</p>
                            {r.referee?.current_company && <p className="text-gray-400 text-xs">{r.referee.current_company}</p>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{r.message || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.job_post_id ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                              {r.job_post_id ? 'Job Post' : 'Direct'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(r.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )
        )}
      </div>
      <Footer />
    </div>
  )
}
