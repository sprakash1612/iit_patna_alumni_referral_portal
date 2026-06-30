// Supabase Edge Function: send-guest-referral
// Sends referral request emails for non-IITP guest users.
// Referee gets guest's full contact details.
// Guest gets confirmation with referee's NAME + COMPANY only (NO PII).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { referee_id, job_post_id, guest_name, guest_email, guest_mobile, message } = await req.json()

    if (!referee_id || !guest_name || !guest_email) {
      return new Response(JSON.stringify({ error: 'referee_id, guest_name and guest_email are required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch referee — only need name, company, emails for sending
    const { data: referee } = await supabase
      .from('profiles')
      .select('name, college_email, personal_email, current_company, designation')
      .eq('id', referee_id)
      .single()

    if (!referee) {
      return new Response(JSON.stringify({ error: 'Referee not found.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const transporter = nodemailer.createTransport({
      host:   Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port:   Number(Deno.env.get('SMTP_PORT') ?? 587),
      secure: false,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    })

    const from = `"IITP Referral Portal" <${Deno.env.get('SMTP_FROM')}>`
    const jobCtx = job_post_id ? ' (via job post)' : ''

    // ── Email to REFEREE — show full guest details ────────────────
    const refereeEmails = [referee.college_email, referee.personal_email].filter(Boolean).join(', ')

    const refereeHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#1e3a5f;margin-bottom:4px">New Referral Request from External Candidate</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px">
          Someone outside IIT Patna is requesting a referral from you${jobCtx} via the IITP Referral Portal.
        </p>
        <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 6px;font-weight:600;color:#1e3a5f;font-size:16px">${guest_name}</p>
          <p style="margin:0 0 4px;color:#374151;font-size:14px">📧 ${guest_email}</p>
          ${guest_mobile ? `<p style="margin:0;color:#374151;font-size:14px">📱 ${guest_mobile}</p>` : ''}
        </div>
        ${message ? `
        <div style="border-left:3px solid #3b82f6;padding-left:12px;margin-bottom:20px;color:#374151;font-size:14px;font-style:italic">
          "${message}"
        </div>` : ''}
        <p style="color:#374151;font-size:14px">
          You can reply directly to <a href="mailto:${guest_email}" style="color:#2563eb">${guest_email}</a>.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center">IITP Referral Portal · IIT Patna Alumni Network</p>
      </div>
    `

    // ── Email to GUEST — NO referee PII, name + company only ─────
    const guestHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#1e3a5f;margin-bottom:4px">Referral Request Submitted ✓</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px">
          Hi ${guest_name}, your referral request has been submitted successfully${jobCtx}.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 4px;color:#374151;font-size:14px">Request sent to:</p>
          <p style="margin:0 0 2px;font-weight:600;color:#1e3a5f">${referee.name}</p>
          ${referee.current_company ? `<p style="margin:0;color:#6b7280;font-size:13px">${referee.designation ?? ''} @ ${referee.current_company}</p>` : ''}
        </div>
        <p style="color:#374151;font-size:14px">
          The alumni has been notified and will reach out to you at <strong>${guest_email}</strong> if interested.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center">IITP Referral Portal · IIT Patna Alumni Network</p>
      </div>
    `

    await Promise.all([
      transporter.sendMail({
        from,
        to:      refereeEmails,
        subject: `External referral request from ${guest_name} — IITP Referral Portal`,
        html:    refereeHtml,
      }),
      transporter.sendMail({
        from,
        to:      guest_email,
        subject: `Your referral request has been submitted — IITP Referral Portal`,
        html:    guestHtml,
      }),
    ])

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
