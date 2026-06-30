import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ShieldCheck, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function VerifyOtp() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const email = location.state?.email || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const refs = useRef([])

  useEffect(() => {
    if (!email) navigate('/register')
  }, [email, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      refs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      toast.error('Please enter the complete 6-digit OTP')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code })
      login(data.token, data.user)
      toast.success(data.message)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed.')
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post('/auth/resend-otp', { email })
      toast.success('OTP resent! Check your inbox.')
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <ShieldCheck className="text-brand-800" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
          <p className="text-blue-200 text-sm mt-1">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-white">{email}</span>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label text-center block">Enter OTP</label>
              <div className="flex justify-center gap-2 mt-2" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition"
                  />
                ))}
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">Valid for 10 minutes</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <ShieldCheck size={16} />
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="flex items-center gap-1.5 mx-auto text-sm text-brand-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              {countdown > 0 ? `Resend in ${countdown}s` : resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-4">
            Wrong email?{' '}
            <Link to="/register" className="text-brand-700 font-semibold hover:underline">
              Go back
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
