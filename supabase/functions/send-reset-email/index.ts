// Supabase Edge Function: send-reset-email
// Verifies college + personal email match, generates a password reset link,
// and sends it to BOTH college and personal email via SMTP.
//
// Deploy via Supabase Dashboard > Edge Functions > New Function
// Name: send-reset-email
//
// Required secrets (same as send-referral-email):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { college_email, personal_email, redirect_to } = await req.json()

    if (!college_email || !personal_email) {
      return new Response(JSON.stringify({ error: 'Both emails are required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Step 1 — Verify both emails match a profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, college_email, personal_email')
      .eq('college_email', college_email.toLowerCase().trim())
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'No account found with this college email.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!profile.personal_email) {
      return new Response(JSON.stringify({ error: 'No personal email on record. Contact admin.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.personal_email.toLowerCase().trim() !== personal_email.toLowerCase().trim()) {
      return new Response(JSON.stringify({ error: 'Personal email does not match our records.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 2 — Generate password reset link via Supabase Admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: profile.college_email,
      options: {
        redirectTo: redirect_to ?? 'https://iitp-referrals.pages.dev/reset-password',
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      return new Response(JSON.stringify({ error: 'Failed to generate reset link.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resetLink = linkData.properties.action_link

    // Step 3 — Send to both emails via SMTP
    const transporter = nodemailer.createTransport({
      host:   Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port:   Number(Deno.env.get('SMTP_PORT') ?? 587),
      secure: false,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    })

    const recipients = [profile.college_email, profile.personal_email].filter(Boolean).join(', ')

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#1e3a5f;margin-bottom:4px">Reset Your Password</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px">
          Hi ${profile.name}, we received a request to reset your IITP Referral Portal password.
        </p>

        <div style="text-align:center;margin:28px 0">
          <a href="${resetLink}"
            style="background:#1e3a5f;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">
            Reset Password
          </a>
        </div>

        <p style="color:#6b7280;font-size:13px">
          Or copy and paste this link in your browser:<br/>
          <a href="${resetLink}" style="color:#2563eb;word-break:break-all">${resetLink}</a>
        </p>

        <p style="color:#9ca3af;font-size:12px;margin-top:20px">
          This link expires in <strong>1 hour</strong>. If you did not request a password reset, ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center">IITP Referral Portal · IIT Patna Alumni Network</p>
      </div>
    `

    await transporter.sendMail({
      from:    `"IITP Referral Portal" <${Deno.env.get('SMTP_FROM')}>`,
      to:      recipients,
      subject: 'Reset your IITP Referral Portal password',
      html,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Server error. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
