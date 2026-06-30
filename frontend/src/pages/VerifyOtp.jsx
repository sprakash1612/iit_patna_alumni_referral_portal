import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// OTP verification removed — users are auto-verified on registration
export default function VerifyOtp() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/login', { replace: true }) }, [navigate])
  return null
}
