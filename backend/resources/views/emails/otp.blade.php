<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
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
                            <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Hello, {{ $name }}!</h2>
                            <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
                                Thank you for registering on the IITP Referral Portal. Please use the OTP below to verify your email address.
                            </p>

                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:20px 0;">
                                        <div style="display:inline-block;background-color:#eff6ff;border:2px solid #1e40af;border-radius:10px;padding:20px 48px;">
                                            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1e40af;">{{ $otp }}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#4b5563;line-height:1.6;margin:16px 0;">
                                This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
                            </p>
                            <p style="color:#6b7280;font-size:14px;margin:0;">
                                If you did not register on IITP Referral Portal, please ignore this email.
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
