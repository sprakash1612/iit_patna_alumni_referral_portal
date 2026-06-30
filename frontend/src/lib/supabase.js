import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: upsert skills and return their IDs
export async function syncSkills(userId, skillNames) {
  if (!skillNames || skillNames.length === 0) {
    await supabase.from('user_skills').delete().eq('user_id', userId)
    return
  }
  const normalized = skillNames.map(s => s.trim().toLowerCase()).filter(Boolean)

  // Upsert each skill
  for (const name of normalized) {
    await supabase.from('skills').upsert({ name }, { onConflict: 'name', ignoreDuplicates: true })
  }

  // Fetch their IDs
  const { data: skillRows } = await supabase
    .from('skills').select('id, name').in('name', normalized)

  // Replace user_skills entirely
  await supabase.from('user_skills').delete().eq('user_id', userId)
  if (skillRows?.length) {
    await supabase.from('user_skills').insert(
      skillRows.map(s => ({ user_id: userId, skill_id: s.id }))
    )
  }
}

// Helper: fetch full profile with skills
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`*, user_skills(skills(name))`)
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return {
    ...data,
    skills: (data.user_skills || []).map(us => us.skills?.name).filter(Boolean),
  }
}
