import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, X, Save, ArrowLeft, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:             user?.name || '',
    personal_email:   user?.personal_email || '',
    mobile:           user?.mobile || '',
    current_company:  user?.current_company || '',
    designation:      user?.designation || '',
    total_experience: user?.total_experience || '',
  })
  const [showMobile, setShowMobile]         = useState(user?.show_mobile ?? true)
  const [prevCompanies, setPrevCompanies]   = useState(user?.previous_company || [])
  const [prevCompanyInput, setPrevCompanyInput] = useState('')
  const [skills, setSkills]                 = useState(user?.skills?.map(s => s.name ?? s) || [])
  const [skillInput, setSkillInput]         = useState('')

  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwords, setPasswords] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [showPass, setShowPass]   = useState(false)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const addPrevCompany = () => {
    const c = prevCompanyInput.trim()
    if (!c) return
    if (prevCompanies.map(x => x.toLowerCase()).includes(c.toLowerCase())) {
      toast.error('Company already added'); return
    }
    setPrevCompanies([...prevCompanies, c])
    setPrevCompanyInput('')
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s) return
    if (skills.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
      toast.error('Skill already added'); return
    }
    setSkills([...skills, s])
    setSkillInput('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        show_mobile:      showMobile,
        previous_company: prevCompanies,
        skills,
        ...(showPasswordSection && passwords.current_password ? passwords : {}),
      }
      const { data } = await api.patch('/profile', payload)
      updateUser(data.user)
      toast.success('Profile updated successfully!')
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
      setShowPasswordSection(false)
    } catch (err) {
      const res = err.response
      if (res?.status === 422) {
        setErrors(res.data.errors || {})
        toast.error(res.data.message || 'Please fix the errors below.')
      } else {
        toast.error(res?.data?.message || 'Update failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, opts = {}) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={opts.type || 'text'}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={opts.placeholder || ''}
        className="input"
      />
      {errors[name] && <p className="error-text">{errors[name][0]}</p>}
    </div>
  )

  const tagList = (items, onRemove, colorClass = 'bg-blue-50 text-brand-800 border-blue-100') =>
    items.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-3">
        {items.map((item, i) => (
          <span key={i} className={`flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-full border ${colorClass}`}>
            {item}
            <button type="button" onClick={() => onRemove(i)} className="text-brand-600 hover:text-red-500 ml-0.5">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-sm">{user?.college_email}</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Account */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Account</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('name', 'Full Name', { placeholder: 'Rahul Kumar' })}
                <div>
                  <label className="label">College Email</label>
                  <input
                    type="email"
                    value={user?.college_email}
                    disabled
                    className="input bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">College email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Personal */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('personal_email', 'Personal Email', { type: 'email', placeholder: 'yourname@gmail.com' })}
                {field('mobile', 'Mobile Number', { placeholder: '+91 9876543210' })}
              </div>
              <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showMobile}
                  onChange={e => setShowMobile(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-700 focus:ring-brand-600"
                />
                <span className="text-sm text-gray-600">Show my mobile number to other members</span>
              </label>
            </div>

            {/* Professional */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Professional Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('current_company', 'Current Company', { placeholder: 'Google' })}
                {field('designation', 'Designation', { placeholder: 'Software Engineer' })}
                {field('total_experience', 'Total Experience', { placeholder: '2 years' })}
              </div>

              <div className="mt-4">
                <label className="label">Previous Companies</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prevCompanyInput}
                    onChange={e => setPrevCompanyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPrevCompany() } }}
                    placeholder="Type a company and press Enter"
                    className="input flex-1"
                  />
                  <button type="button" onClick={addPrevCompany} className="btn-secondary whitespace-nowrap">Add</button>
                </div>
                {tagList(prevCompanies, i => setPrevCompanies(prevCompanies.filter((_, idx) => idx !== i)), 'bg-orange-50 text-orange-800 border-orange-100')}
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
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Type a skill and press Enter"
                  className="input flex-1"
                />
                <button type="button" onClick={addSkill} className="btn-secondary whitespace-nowrap">Add</button>
              </div>
              {tagList(skills, i => setSkills(skills.filter((_, idx) => idx !== i)))}
            </div>

            {/* Password Change */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Security</h3>
              {!showPasswordSection ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(true)}
                  className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 font-medium"
                >
                  <Lock size={14} />
                  Change Password
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          name="current_password"
                          value={passwords.current_password}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          className="input pr-10"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.current_password && <p className="error-text">{errors.current_password[0]}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">New Password</label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        value={passwords.password}
                        onChange={handlePasswordChange}
                        placeholder="Min. 8 characters"
                        className="input"
                      />
                      {errors.password && <p className="error-text">{errors.password[0]}</p>}
                    </div>
                    <div>
                      <label className="label">Confirm New Password</label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password_confirmation"
                        value={passwords.password_confirmation}
                        onChange={handlePasswordChange}
                        placeholder="Repeat new password"
                        className="input"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordSection(false); setPasswords({ current_password: '', password: '', password_confirmation: '' }) }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Cancel password change
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
