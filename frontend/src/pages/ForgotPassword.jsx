import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function ForgotPassword() {
  const [form, setForm]     = useState({ college_email: '', personal_email: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.college_email.toLowerCase().endsWith('@iitp.ac.in')) {
      setError('Must be a @iitp.ac.in email.'); return
    }
    setLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-reset-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({
          college_email:  form.college_email.toLowerCase().trim(),
          personal_email: form.personal_email.toLowerCase().trim(),
          redirect_to:    `${window.location.origin}/reset-password`,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send reset link.'); return }
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-900 to-brand-700">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <img src="/iitp-logo.png" alt="IIT Patna" className="w-10 h-10 object-contain"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
            <span className="text-brand-800 font-black text-xl hidden">II</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-blue-200 text-sm mt-1">Reset link will be sent to both your emails</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-green-600" size={28} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Check your emails</h3>
              <p className="text-gray-500 text-sm mt-2">
                A password reset link has been sent to both your
                <span className="font-semibold text-gray-700"> college</span> and
                <span className="font-semibold text-gray-700"> personal</span> email addresses.
              </p>
              <p className="text-gray-400 text-xs mt-3">The link expires in 1 hour.</p>
                      <Link to="/login" className="mt-6 inline-block btn-primary text-sm">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-sm text-blue-700">
                Enter your college email and the personal email you registered with. If they match, a reset link will be sent to <strong>both</strong>.
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
                {error && <p className="error-text text-center">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  <KeyRound size={16} />
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-6">
                Remembered it?{' '}
                <Link to="/login" className="text-brand-700 font-semibold hover:underline">Back to Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  )
}
