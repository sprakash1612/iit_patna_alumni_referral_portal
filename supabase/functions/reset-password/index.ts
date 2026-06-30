// Supabase Edge Function: reset-password
// Deploy: supabase functions deploy reset-password
// This allows password reset by verifying college_email + personal_email match

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { college_email, personal_email, password } = await req.json()

    if (!college_email || !personal_email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify both emails match a profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, college_email, personal_email')
      .eq('college_email', college_email.toLowerCase())
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'No account found with this college email.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!profile.personal_email) {
      return new Response(JSON.stringify({ error: 'No personal email on record. Contact admin.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.personal_email.toLowerCase() !== personal_email.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Personal email does not match our records.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password }
    )

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'Password reset successfully. You can now log in.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
