import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    college_email: '', personal_email: '',
    password: '', password_confirmation: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.college_email.endsWith('@iitp.ac.in')) {
      setErrors({ ...errors, college_email: ['Must be an @iitp.ac.in email.'] })
      return
    }
    if (form.password !== form.password_confirmation) {
      setErrors({ ...errors, password_confirmation: ['Passwords do not match.'] })
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', form)
      toast.success(data.message)
      navigate('/login')
    } catch (err) {
      const res = err.response
      if (res?.status === 422) {
        setErrors(res.data.errors || {})
        toast.error(res.data.message || 'Please fix the errors below.')
      } else {
        toast.error(res?.data?.message || 'Reset failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <img
              src="/iitp-logo.png"
              alt="IIT Patna"
              className="w-10 h-10 object-contain"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }}
            />
            <span className="text-brand-800 font-black text-xl hidden">II</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-blue-200 text-sm mt-1">
            Verify your identity using your registered personal email
          </p>
        </div>

        <div className="card">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-sm text-blue-700">
            <strong>How it works:</strong> Enter your IITP college email and the personal email you registered with. If they match, you can set a new password.
            <br /><br />
            <span className="text-blue-500">Didn't add a personal email?</span> Contact the portal admin to reset your account.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">College Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="college_email"
                value={form.college_email}
                onChange={handleChange}
                placeholder="yourname@iitp.ac.in"
                className="input"
                required
              />
              {errors.college_email && <p className="error-text">{errors.college_email[0]}</p>}
            </div>

            <div>
              <label className="label">Personal Email (registered) <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="personal_email"
                value={form.personal_email}
                onChange={handleChange}
                placeholder="yourname@gmail.com"
                className="input"
                required
              />
              {errors.personal_email && <p className="error-text">{errors.personal_email[0]}</p>}
            </div>

            <div>
              <label className="label">New Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className="input pr-10"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password[0]}</p>}
            </div>

            <div>
              <label className="label">Confirm New Password <span className="text-red-500">*</span></label>
              <input
                type={showPass ? 'text' : 'password'}
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={handleChange}
                placeholder="Repeat new password"
                className="input"
                required
              />
              {errors.password_confirmation && <p className="error-text">{errors.password_confirmation[0]}</p>}
            </div>

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
