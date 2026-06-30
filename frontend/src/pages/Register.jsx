import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, X, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const INITIAL = {
  name: '', college_email: '', personal_email: '', mobile: '',
  current_company: '', previous_company: '', designation: '',
  total_experience: '', password: '', password_confirmation: '',
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s) return
    if (skills.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
      toast.error('Skill already added')
      return
    }
    setSkills([...skills, s])
    setSkillInput('')
  }

  const removeSkill = (index) => setSkills(skills.filter((_, i) => i !== index))

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.college_email.endsWith('@iitp.ac.in')) {
      setErrors({ ...errors, college_email: ['Only @iitp.ac.in email addresses are allowed.'] })
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { ...form, skills })
      toast.success('Registered! Check your IITP email for the OTP.')
      navigate('/verify-otp', { state: { email: data.email } })
    } catch (err) {
      const res = err.response
      if (res?.status === 422) {
        setErrors(res.data.errors || {})
        toast.error(res.data.message || 'Please fix the errors below.')
      } else {
        toast.error(res?.data?.message || 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, opts = {}) => (
    <div>
      <label className="label">{label}{!opts.optional && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={opts.type || 'text'}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={opts.placeholder || ''}
        className="input"
        required={!opts.optional}
      />
      {errors[name] && <p className="error-text">{errors[name][0]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-brand-800 font-black text-2xl">II</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-blue-200 text-sm mt-1">Join the IITP Referral Network</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Account Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('name', 'Full Name', { placeholder: 'Rahul Kumar' })}
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
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Password <span className="text-red-500">*</span></label>
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
                <label className="label">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="input"
                  required
                />
              </div>
            </div>

            {/* Personal Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('personal_email', 'Personal Email', { type: 'email', optional: true, placeholder: 'yourname@gmail.com' })}
                {field('mobile', 'Mobile Number', { optional: true, placeholder: '+91 9876543210' })}
              </div>
            </div>

            {/* Professional Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Professional Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('current_company', 'Current Company', { optional: true, placeholder: 'Google' })}
                {field('previous_company', 'Previous Company', { optional: true, placeholder: 'Amazon' })}
                {field('designation', 'Designation', { optional: true, placeholder: 'Software Engineer' })}
                {field('total_experience', 'Total Experience', { optional: true, placeholder: '2 years' })}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Skills</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type a skill and press Enter (e.g. React, Python)"
                  className="input flex-1"
                />
                <button type="button" onClick={addSkill} className="btn-secondary whitespace-nowrap">Add</button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-brand-800 text-sm font-medium rounded-full border border-blue-100">
                      {s}
                      <button type="button" onClick={() => removeSkill(i)} className="text-brand-600 hover:text-red-500 ml-0.5">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              <UserPlus size={16} />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-700 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
