import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    college_email: '', personal_email: '',
    password: '', password_confirmation: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.college_email.toLowerCase().endsWith('@iitp.ac.in')) {
      setError('Must be a @iitp.ac.in email.'); return
    }
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.'); return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return
    }
    setLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('reset_password_by_personal_email', {
        p_college_email:  form.college_email.toLowerCase().trim(),
        p_personal_email: form.personal_email.toLowerCase().trim(),
        p_new_password:   form.password,
      })
      if (rpcError) { setError(rpcError.message); return }
      if (data?.startsWith('error')) {
        setError(
          data.includes('no account found')
            ? 'No account found or personal email does not match our records.'
            : data.replace('error: ', '')
        )
        return
      }
      toast.success('Password reset successfully! You can now log in.')
      navigate('/login')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-blue-200 text-sm mt-1">Verify using your registered personal email</p>
        </div>

        <div className="card">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-sm text-blue-700">
            Enter your IITP college email + the <strong>personal email you registered with</strong>. If they match, you can set a new password instantly — no email required.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">College Email <span className="text-red-500">*</span></label>
              <input type="email" name="college_email" value={form.college_email}
                onChange={handleChange} placeholder="yourname@iitp.ac.in" className="input" required />
            </div>
            <div>
              <label className="label">Personal Email (registered) <span className="text-red-500">*</span></label>
              <input type="email" name="personal_email" value={form.personal_email}
                onChange={handleChange} placeholder="yourname@gmail.com" className="input" required />
            </div>
            <div>
              <label className="label">New Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} placeholder="Min. 8 characters" className="input pr-10" required minLength={8} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm New Password <span className="text-red-500">*</span></label>
              <input type={showPass ? 'text' : 'password'} name="password_confirmation"
                value={form.password_confirmation} onChange={handleChange}
                placeholder="Repeat new password" className="input" required />
            </div>
            {error && <p className="error-text text-center">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              <KeyRound size={16} />
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Remembered it?{' '}
            <Link to="/login" className="text-brand-700 font-semibold hover:underline">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
