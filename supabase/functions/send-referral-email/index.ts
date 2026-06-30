// Supabase Edge Function: send-referral-email
// Triggered by Database Webhook on referral_requests INSERT
// Sends email notification to referee (received request)
// and confirmation to requester (sent request)
//
// Deploy via Supabase Dashboard > Edge Functions > New Function
// Required secrets (set in Edge Function settings):
//   SMTP_HOST     = smtp.gmail.com
//   SMTP_PORT     = 587
//   SMTP_USER     = your-gmail@gmail.com
//   SMTP_PASS     = your-16-char-app-password
//   SMTP_FROM     = your-gmail@gmail.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()

    // Works both as a direct call and as a database webhook
    const record = payload.record ?? payload

    const { requester_id, referee_id, job_post_id, message } = record

    // Use service role to fetch profiles
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const [{ data: requester }, { data: referee }] = await Promise.all([
      supabase.from('profiles').select('name, college_email, personal_email, designation, current_company, total_experience').eq('id', requester_id).single(),
      supabase.from('profiles').select('name, college_email, personal_email').eq('id', referee_id).single(),
    ])

    if (!requester || !referee) {
      return new Response(JSON.stringify({ error: 'Profiles not found' }), { status: 404, headers: corsHeaders })
    }

    // Build recipient lists (college + personal if available)
    const refereeEmails  = [referee.college_email, referee.personal_email].filter(Boolean)
    const requesterEmails = [requester.college_email, requester.personal_email].filter(Boolean)

    // Set up SMTP transporter
    const transporter = nodemailer.createTransport({
      host:   Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port:   Number(Deno.env.get('SMTP_PORT') ?? 587),
      secure: false,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    })

    const fromAddress = `"IITP Referral Portal" <${Deno.env.get('SMTP_FROM')}>`
    const jobContext  = job_post_id ? ' (via job post)' : ''

    // ── Email to REFEREE ──────────────────────────────────────────
    const refereeHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#1e3a5f;margin-bottom:4px">New Referral Request</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px">Someone from IIT Patna Alumni Network is requesting a referral from you${jobContext}.</p>

        <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 4px;font-weight:600;color:#1e3a5f;font-size:16px">${requester.name}</p>
          <p style="margin:0 0 4px;color:#374151;font-size:14px">${requester.designation ?? ''}${requester.current_company ? ` @ ${requester.current_company}` : ''}</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px">${requester.college_email}</p>
          ${requester.total_experience ? `<p style="margin:0;color:#6b7280;font-size:13px">Experience: ${requester.total_experience}</p>` : ''}
        </div>

        ${message ? `
        <div style="border-left:3px solid #3b82f6;padding-left:12px;margin-bottom:20px;color:#374151;font-size:14px;font-style:italic">
          "${message}"
        </div>` : ''}

        <p style="color:#374151;font-size:14px">You can reply directly to <a href="mailto:${requester.college_email}" style="color:#2563eb">${requester.college_email}</a>${requester.personal_email ? ` or <a href="mailto:${requester.personal_email}" style="color:#2563eb">${requester.personal_email}</a>` : ''}.</p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center">IITP Referral Portal · IIT Patna Alumni Network</p>
      </div>
    `

    // ── Email to REQUESTER (confirmation) ─────────────────────────
    const requesterHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#1e3a5f;margin-bottom:4px">Referral Request Sent ✓</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px">Your referral request has been sent successfully${jobContext}.</p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 4px;color:#374151;font-size:14px">Request sent to:</p>
          <p style="margin:0 0 2px;font-weight:600;color:#1e3a5f">${referee.name}</p>
          <p style="margin:0;color:#6b7280;font-size:13px">${referee.college_email}</p>
        </div>

        <p style="color:#374151;font-size:14px">We've notified <strong>${referee.name}</strong> about your request. You can also follow up directly at <a href="mailto:${referee.college_email}" style="color:#2563eb">${referee.college_email}</a>.</p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center">IITP Referral Portal · IIT Patna Alumni Network</p>
      </div>
    `

    // Send both emails in parallel
    await Promise.all([
      transporter.sendMail({
        from:    fromAddress,
        to:      refereeEmails.join(', '),
        subject: `${requester.name} is requesting a referral — IITP Referral Portal`,
        html:    refereeHtml,
      }),
      transporter.sendMail({
        from:    fromAddress,
        to:      requesterEmails.join(', '),
        subject: `Referral request sent to ${referee.name} — IITP Referral Portal`,
        html:    requesterHtml,
      }),
    ])

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
