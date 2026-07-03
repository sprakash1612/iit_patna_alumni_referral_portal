import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, fetchProfile, syncSkills } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          setUser(profile)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const register = async ({ name, college_email, personal_email, mobile, show_mobile,
    current_company, previous_company, designation, total_experience, course, linkedin_url, password, skills }) => {

    const { data, error } = await supabase.auth.signUp({
      email: college_email.toLowerCase(),
      password,
    })
    if (error) throw error

    const uid = data.user.id

    const { error: profileError } = await supabase.from('profiles').insert({
      id:               uid,
      name,
      college_email:    college_email.toLowerCase(),
      personal_email:   personal_email || null,
      mobile:           mobile || null,
      show_mobile:      show_mobile ?? true,
      current_company:  current_company || null,
      previous_company: previous_company || [],
      designation:      designation || null,
      total_experience: total_experience || null,
      course:           course || null,
      linkedin_url:     linkedin_url || null,
      is_verified:      true,
    })
    if (profileError) throw profileError

    if (skills?.length) await syncSkills(uid, skills)

    const profile = await fetchProfile(uid)
    setUser(profile)
    return profile
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })
    if (error) throw error
    const profile = await fetchProfile(data.user.id)
    setUser(profile)
    return profile
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateUser = async ({ name, personal_email, mobile, show_mobile,
    current_company, previous_company, designation, total_experience,
    course, linkedin_url, skills }) => {

    const { error } = await supabase.from('profiles').update({
      name,
      personal_email:   personal_email || null,
      mobile:           mobile || null,
      show_mobile:      show_mobile ?? true,
      current_company:  current_company || null,
      previous_company: previous_company || [],
      designation:      designation || null,
      total_experience: total_experience || null,
      course:           course || null,
      linkedin_url:     linkedin_url || null,
    }).eq('id', user.id)
    if (error) throw error

    if (skills !== undefined) await syncSkills(user.id, skills)

    const updated = await fetchProfile(user.id)
    setUser(updated)
    return updated
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
