# Connect FRAME email

FRAME's verification and password-recovery flow is implemented. Actual inbox delivery needs your own email service credentials in `backend/.env`. Do not paste credentials in chat, commit them, or place them in frontend variables.

## Resend — suggested for public launch

1. Create a Resend account and verify a domain you control using its dashboard's DNS records.
2. Create a sending API key and add these values to `backend/.env` locally:

```dotenv
APP_PUBLIC_URL=https://your-frame-site.example
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_FROM=FRAME <accounts@your-verified-domain.example>
SMTP_USERNAME=resend
SMTP_PASSWORD=your-resend-api-key
```

The addresses above are placeholders. Use a real sender on your verified domain and the URL where recipients can reach FRAME. For your own local test, `APP_PUBLIC_URL=http://127.0.0.1:5173` works only on the computer running FRAME.

Official setup: https://resend.com/docs/send-with-smtp

## Gmail SMTP — option for a small local test

1. Use an account you control with 2-Step Verification enabled and an app password available. Use an app password, not your normal Google password.
2. Set the following locally:

```dotenv
APP_PUBLIC_URL=http://127.0.0.1:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_FROM=your-sending-account@gmail.com
SMTP_USERNAME=your-sending-account@gmail.com
SMTP_PASSWORD=your-google-app-password
```

Official app-password guide: https://support.google.com/mail/answer/185833

## Verify delivery

Restart the backend after editing `.env`. On FRAME, open **Settings → Email & account recovery**. Add your address with your current FRAME password, then send verification. Open the message and click **Confirm my email**. Settings should show **Verified**. Check Spam if needed.

Next use **Forgot password?** from login. Open the reset link, choose a new password yourself, and confirm it. The link expires after 30 minutes and can be used once. A successful reset signs out existing sessions.

Verification links expire after 24 hours, are single-use, and only work for the address currently saved on the account. Changing the recovery address revokes outstanding links. Email verification does not change your password. Signup remains usable when delivery is not configured, but password recovery is unavailable until the address is verified.

## Implementation and validation

- Only token hashes are stored in the database; raw tokens are sent in mail links and are never returned by the API.
- Verification resend is limited to once per minute per account. Reset requests have a per-address cooldown.
- Public profile and movie APIs never expose recovery addresses.
- SMTP connections use TLS and validate the server certificate.
- Automated tests capture messages through a fake SMTP transport and follow the same verification/reset endpoints. They do not demonstrate live provider acceptance or inbox delivery.

Live delivery has **not** been confirmed on this installation. Finish the provider setup above to enable it.
