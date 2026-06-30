import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate              = useNavigate()
  const [ready, setReady]     = useState(false)
  const [form, setForm]       = useState({ password: '', password_confirmation: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    // Supabase puts the session tokens in the URL hash after redirect
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.'); return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password })
      if (error) { setError(error.message); return }
      toast.success('Password updated successfully!')
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 px-4">
        <div className="card w-full max-w-md text-center py-10">
          <p className="text-gray-500">Verifying reset link...</p>
          <p className="text-gray-400 text-sm mt-2">
            If this takes too long, your link may have expired.{' '}
            <a href="/forgot-password" className="text-brand-700 hover:underline">Request a new one</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <img src="/iitp-logo.png" alt="IIT Patna" className="w-10 h-10 object-contain"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
            <span className="text-brand-800 font-black text-xl hidden">II</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError('') }}
                  placeholder="Min. 8 characters" className="input pr-10" required minLength={8} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm New Password <span className="text-red-500">*</span></label>
              <input type={showPass ? 'text' : 'password'} value={form.password_confirmation}
                onChange={e => { setForm({ ...form, password_confirmation: e.target.value }); setError('') }}
                placeholder="Repeat new password" className="input" required />
            </div>
            {error && <p className="error-text text-center">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              <KeyRound size={16} />
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
