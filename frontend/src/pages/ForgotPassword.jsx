import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.toLowerCase().endsWith('@iitp.ac.in')) {
      toast.error('Must be a @iitp.ac.in email.'); return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) { toast.error(error.message); return }
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
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
          <p className="text-blue-200 text-sm mt-1">We'll send a reset link to your IITP email</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-green-600" size={28} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Check your email</h3>
              <p className="text-gray-500 text-sm mt-2">
                A password reset link has been sent to<br />
                <span className="font-semibold text-gray-700">{email}</span>
              </p>
              <p className="text-gray-400 text-xs mt-3">
                Click the link in the email to set a new password.<br />
                The link expires in 1 hour.
              </p>
              <button onClick={() => setSent(false)} className="mt-6 text-sm text-brand-700 hover:underline">
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">College Email <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@iitp.ac.in" className="input" required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
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
  )
}
