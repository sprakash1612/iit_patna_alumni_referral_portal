<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referral Request</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

                    <!-- Header -->
                    <tr>
                        <td style="background-color:#1e40af;padding:30px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">IITP Referral Portal</h1>
                            <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">IIT Patna Alumni Network</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 40px 20px;">
                            <h2 style="color:#1e293b;margin:0 0 8px;font-size:20px;">Hello, {{ $referee->name }}!</h2>
                            <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
                                Your fellow IITPian <strong>{{ $requester->name }}</strong> is requesting a referral from you through the IITP Referral Portal.
                            </p>

                            <!-- Requester Card -->
                            <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:24px;margin-bottom:24px;">
                                <h3 style="color:#1e40af;margin:0 0 16px;font-size:16px;">Requester Details</h3>

                                <table width="100%" cellpadding="4" cellspacing="0">
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;width:40%;padding:4px 0;">Full Name</td>
                                        <td style="color:#1e293b;font-size:13px;font-weight:600;padding:4px 0;">{{ $requester->name }}</td>
                                    </tr>
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;padding:4px 0;">College Email</td>
                                        <td style="color:#1e293b;font-size:13px;padding:4px 0;">{{ $requester->college_email }}</td>
                                    </tr>
                                    @if($requester->personal_email)
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;padding:4px 0;">Personal Email</td>
                                        <td style="color:#1e293b;font-size:13px;padding:4px 0;">{{ $requester->personal_email }}</td>
                                    </tr>
                                    @endif
                                    @if($requester->mobile)
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;padding:4px 0;">Mobile</td>
                                        <td style="color:#1e293b;font-size:13px;padding:4px 0;">{{ $requester->mobile }}</td>
                                    </tr>
                                    @endif
                                    @if($requester->designation)
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;padding:4px 0;">Designation</td>
                                        <td style="color:#1e293b;font-size:13px;padding:4px 0;">{{ $requester->designation }}</td>
                                    </tr>
                                    @endif
                                    @if($requester->current_company)
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;padding:4px 0;">Current Company</td>
                                        <td style="color:#1e293b;font-size:13px;padding:4px 0;">{{ $requester->current_company }}</td>
                                    </tr>
                                    @endif
                                    @if($requester->previous_company)
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;padding:4px 0;">Previous Company</td>
                                        <td style="color:#1e293b;font-size:13px;padding:4px 0;">{{ $requester->previous_company }}</td>
                                    </tr>
                                    @endif
                                    @if($requester->total_experience)
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;padding:4px 0;">Experience</td>
                                        <td style="color:#1e293b;font-size:13px;padding:4px 0;">{{ $requester->total_experience }}</td>
                                    </tr>
                                    @endif
                                    @if($requester->skills->count() > 0)
                                    <tr>
                                        <td style="color:#6b7280;font-size:13px;padding:4px 0;vertical-align:top;">Skills</td>
                                        <td style="color:#1e293b;font-size:13px;padding:4px 0;">{{ $requester->skills->pluck('name')->map('ucfirst')->implode(', ') }}</td>
                                    </tr>
                                    @endif
                                </table>
                            </div>

                            @if($personalMessage)
                            <!-- Personal Message -->
                            <div style="background-color:#fefce8;border-left:4px solid #eab308;border-radius:4px;padding:16px;margin-bottom:24px;">
                                <p style="color:#713f12;font-size:13px;margin:0 0 4px;font-weight:600;">Personal Message:</p>
                                <p style="color:#854d0e;font-size:14px;margin:0;line-height:1.6;">{{ $personalMessage }}</p>
                            </div>
                            @endif

                            <p style="color:#4b5563;line-height:1.6;margin:0 0 8px;">
                                Please reach out to {{ $requester->name }} directly at
                                <a href="mailto:{{ $requester->college_email }}" style="color:#1e40af;">{{ $requester->college_email }}</a>
                                if you'd like to help with the referral.
                            </p>
                            <p style="color:#6b7280;font-size:13px;margin:0;">
                                You received this email because you are registered on the IITP Referral Portal.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                            <p style="color:#9ca3af;font-size:12px;margin:0;">
                                &copy; {{ date('Y') }} IITP Referral Portal &bull; IIT Patna
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
