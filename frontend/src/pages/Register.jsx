import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, X, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'

const INITIAL = {
  name: '', college_email: '', personal_email: '', mobile: '',
  current_company: '', designation: '', total_experience: '',
  password: '', password_confirmation: '',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]           = useState(INITIAL)
  const [showMobile, setShowMobile] = useState(true)
  const [prevCompanies, setPrevCompanies]     = useState([])
  const [prevCompanyInput, setPrevCompanyInput] = useState('')
  const [skills, setSkills]       = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [errors, setErrors]       = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const addItem = (input, setInput, list, setList, label) => {
    const v = input.trim()
    if (!v) return
    if (list.map(x => x.toLowerCase()).includes(v.toLowerCase())) { toast.error(`${label} already added`); return }
    setList([...list, v]); setInput('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.college_email.toLowerCase().endsWith('@iitp.ac.in')) {
      setErrors({ ...errors, college_email: ['Only @iitp.ac.in email addresses are allowed.'] })
      return
    }
    if (!form.personal_email) {
      setErrors({ ...errors, personal_email: ['Personal email is required.'] })
      return
    }
    if (form.password !== form.password_confirmation) {
      setErrors({ ...errors, password_confirmation: ['Passwords do not match.'] })
      return
    }
    setLoading(true)
    try {
      await register({
        ...form,
        show_mobile:      showMobile,
        previous_company: prevCompanies,
        skills,
      })
      toast.success('Registration successful!')
      navigate('/home')
    } catch (err) {
      const msg = err.message || 'Registration failed.'
      if (msg.includes('already registered') || msg.includes('already been taken')) {
        setErrors({ ...errors, college_email: ['This email is already registered.'] })
      }
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, opts = {}) => (
    <div>
      <label className="label">{label}{!opts.optional && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={opts.type || 'text'} name={name} value={form[name]} onChange={handleChange}
        placeholder={opts.placeholder || ''} className="input" required={!opts.optional} />
      {errors[name] && <p className="error-text">{errors[name][0]}</p>}
    </div>
  )

  const tagList = (items, onRemove, color = 'bg-blue-50 text-brand-800 border-blue-100') =>
    items.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-3">
        {items.map((item, i) => (
          <span key={i} className={`flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-full border ${color}`}>
            {item}
            <button type="button" onClick={() => onRemove(i)} className="text-brand-600 hover:text-red-500 ml-0.5">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-900 to-brand-700 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <img src="/iitp-logo.png" alt="IIT Patna" className="w-10 h-10 object-contain"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
            <span className="text-brand-800 font-black text-2xl hidden">II</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-blue-200 text-sm mt-1">Join the IITP Referral Network</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('name', 'Full Name', { placeholder: 'Rahul Kumar' })}
                <div>
                  <label className="label">College Email <span className="text-red-500">*</span></label>
                  <input type="email" name="college_email" value={form.college_email} onChange={handleChange}
                    placeholder="yourname@iitp.ac.in" className="input" required />
                  {errors.college_email && (
                    errors.college_email[0].includes('already registered') ? (
                      <p className="error-text">This email is already registered.{' '}
                        <Link to="/login" className="text-brand-700 font-semibold underline">Sign in</Link>
                      </p>
                    ) : <p className="error-text">{errors.college_email[0]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                    onChange={handleChange} placeholder="Min. 8 characters" className="input pr-10" required minLength={8} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="error-text">{errors.password[0]}</p>}
              </div>
              <div>
                <label className="label">Confirm Password <span className="text-red-500">*</span></label>
                <input type={showPass ? 'text' : 'password'} name="password_confirmation"
                  value={form.password_confirmation} onChange={handleChange} placeholder="Repeat password" className="input" required />
                {errors.password_confirmation && <p className="error-text">{errors.password_confirmation[0]}</p>}
              </div>
            </div>

            {/* Personal */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('personal_email', 'Personal Email', { type: 'email', placeholder: 'yourname@gmail.com' })}
                {field('mobile', 'Mobile Number', { optional: true, placeholder: '+91 9876543210' })}
              </div>
              <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none">
                <input type="checkbox" checked={showMobile} onChange={e => setShowMobile(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-700 focus:ring-brand-600" />
                <span className="text-sm text-gray-600">Show my mobile number to other members</span>
              </label>
            </div>

            {/* Professional */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Professional Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('current_company', 'Current Company', { optional: true, placeholder: 'Google' })}
                {field('designation', 'Designation', { optional: true, placeholder: 'Software Engineer' })}
                {field('total_experience', 'Total Experience', { optional: true, placeholder: '2 years' })}
              </div>
              <div className="mt-4">
                <label className="label">Previous Companies <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="flex gap-2">
                  <input type="text" value={prevCompanyInput} onChange={e => setPrevCompanyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(prevCompanyInput, setPrevCompanyInput, prevCompanies, setPrevCompanies, 'Company') } }}
                    placeholder="Type a company and press Enter" className="input flex-1" />
                  <button type="button" onClick={() => addItem(prevCompanyInput, setPrevCompanyInput, prevCompanies, setPrevCompanies, 'Company')} className="btn-secondary whitespace-nowrap">Add</button>
                </div>
                {tagList(prevCompanies, i => setPrevCompanies(prevCompanies.filter((_, idx) => idx !== i)), 'bg-orange-50 text-orange-800 border-orange-100')}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Skills</h3>
              <div className="flex gap-2">
                <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(skillInput, setSkillInput, skills, setSkills, 'Skill') } }}
                  placeholder="Type a skill and press Enter (e.g. React, Python)" className="input flex-1" />
                <button type="button" onClick={() => addItem(skillInput, setSkillInput, skills, setSkills, 'Skill')} className="btn-secondary whitespace-nowrap">Add</button>
              </div>
              {tagList(skills, i => setSkills(skills.filter((_, idx) => idx !== i)))}
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
      <Footer />
    </div>
  )
}
