import { useState } from 'react'
import { X, SendHorizontal, GraduationCap, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// target: { id, name, current_company, designation, post_id? (for job post referrals) }
export default function GuestReferralModal({ target, onClose }) {
  const navigate = useNavigate()
  const [step, setStep]         = useState('ask')   // 'ask' | 'form'
  const [form, setForm]         = useState({ name: '', email: '', mobile: '', message: '' })
  const [sending, setSending]   = useState(false)
  const [errors, setErrors]     = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Name is required.' }); return }
    if (!form.email.trim()) { setErrors({ email: 'Email is required.' }); return }

    setSending(true)
    try {
      // 1 — Store in guest_referral_requests
      const { error: dbErr } = await supabase.from('guest_referral_requests').insert({
        referee_id:   target.id,
        job_post_id:  target.post_id ?? null,
        guest_name:   form.name.trim(),
        guest_email:  form.email.trim().toLowerCase(),
        guest_mobile: form.mobile.trim() || null,
        message:      form.message.trim() || null,
      })
      if (dbErr) { toast.error(dbErr.message); return }

      // 2 — Send email via Edge Function
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-guest-referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({
          referee_id:   target.id,
          job_post_id:  target.post_id ?? null,
          guest_name:   form.name.trim(),
          guest_email:  form.email.trim().toLowerCase(),
          guest_mobile: form.mobile.trim() || null,
          message:      form.message.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to send request.'); return }

      toast.success(`Request sent to ${target.name}! Check your email for confirmation.`)
      onClose()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        {/* Step 1 — IIT Patna check */}
        {step === 'ask' && (
          <div className="text-center py-2">
            <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="text-brand-700" size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Are you from IIT Patna?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Requesting referral from <span className="font-semibold text-gray-700">{target.name}</span>
              {target.current_company ? ` @ ${target.current_company}` : ''}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { onClose(); navigate('/register') }}
                className="flex-1 flex flex-col items-center gap-1.5 p-4 border-2 border-brand-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-colors"
              >
                <GraduationCap size={22} className="text-brand-700" />
                <span className="font-semibold text-brand-800 text-sm">Yes, I'm from IIT Patna</span>
                <span className="text-xs text-gray-400">Register to connect</span>
              </button>
              <button
                onClick={() => setStep('form')}
                className="flex-1 flex flex-col items-center gap-1.5 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <UserCircle size={22} className="text-gray-500" />
                <span className="font-semibold text-gray-700 text-sm">No, I'm an external candidate</span>
                <span className="text-xs text-gray-400">Request without account</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Guest form */}
        {step === 'form' && (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Send Referral Request</h3>
            <p className="text-sm text-gray-500 mb-4">
              To <span className="font-semibold text-gray-700">{target.name}</span>
              {target.current_company ? ` @ ${target.current_company}` : ''}
            </p>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 text-xs text-amber-700">
              Your contact details will be shared with the referee. Their contact info remains private.
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Your Name <span className="text-red-500">*</span></label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Rahul Kumar" className="input" required />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>
              <div>
                <label className="label">Your Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="yourname@gmail.com" className="input" required />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
              <div>
                <label className="label">Mobile <span className="text-gray-400 font-normal">(optional)</span></label>
                <input name="mobile" value={form.mobile} onChange={handleChange}
                  placeholder="+91 9876543210" className="input" />
              </div>
              <div>
                <label className="label">Message <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea name="message" value={form.message} onChange={handleChange}
                  rows={3} maxLength={1000} placeholder="Introduce yourself and why you're reaching out..."
                  className="input resize-none" />
                <p className="text-xs text-gray-400 text-right mt-1">{form.message.length}/1000</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep('ask')} className="btn-secondary flex-1">Back</button>
                <button type="submit" disabled={sending} className="btn-primary flex-1">
                  <SendHorizontal size={16} />
                  {sending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
