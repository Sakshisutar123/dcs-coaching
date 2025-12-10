# Brevo (Sendinblue) Setup Guide

## Overview
This project now uses **Brevo** (formerly Sendinblue) for sending emails instead of MailerSend.

## Step 1: Get Brevo API Key

1. **Sign up/Login:** https://www.brevo.com
2. **Go to:** Settings → SMTP & API → API Keys
3. **Create API Key:**
   - Click "Generate a new API key"
   - Name it: "DCS Coaching Backend"
   - Copy the API key (you won't see it again!)

## Step 2: Verify Sender Email in Brevo

1. **Go to:** Settings → Senders
2. **Add sender:**
   - Email: Your email address (e.g., `noreply@yourdomain.com`)
   - Name: DCS Coaching (optional)
   - Verify the email (check your inbox for verification link)

## Step 3: Update Render Environment Variables

Go to **Render Dashboard → Your Web Service → Environment** tab:

### Required Variables:

```
BREVO_API_KEY=your-brevo-api-key-here
MAIL_FROM=noreply@yourdomain.com
MAIL_FROM_NAME=DCS Coaching
```

### Important Notes:

- **BREVO_API_KEY**: Your Brevo API key (get from Step 1)
- **MAIL_FROM**: Must be an **email address** (verified in Brevo)
- **MAIL_FROM_NAME**: Optional sender name

### Example:

```
BREVO_API_KEY=xkeysib-1234567890abcdef-abcdef1234567890
MAIL_FROM=noreply@dcs-coaching.com
MAIL_FROM_NAME=DCS Coaching
```

## Step 4: Update Local .env File (Optional)

For local development, update your `.env` file:

```env
# Brevo Email Configuration
BREVO_API_KEY=your-brevo-api-key-here
MAIL_FROM=noreply@yourdomain.com
MAIL_FROM_NAME=DCS Coaching
```

## Step 5: Install Dependencies

The code has been updated, but you need to install the Brevo package:

```bash
npm install @getbrevo/brevo
```

Or if deploying to Render, it will install automatically on next deploy.

## Step 6: Test Configuration

After updating environment variables and redeploying:

```bash
GET https://dcs-coaching.onrender.com/api/auth/test-email
```

**Expected Response:**
```json
{
  "message": "Brevo configuration valid",
  "config": {
    "BREVO_API_KEY": "✅ Set",
    "MAIL_FROM": "noreply@yourdomain.com",
    "MAIL_FROM_IS_EMAIL": "✅ Valid",
    "MAIL_FROM_NAME": "DCS Coaching"
  },
  "status": "ready"
}
```

## Step 7: Test Send OTP

```bash
POST https://dcs-coaching.onrender.com/api/auth/send-otp
{
  "uniqueId": "STU001"
}
```

**Expected Response:**
```json
{
  "message": "OTP sent successfully",
  "email": "user@example.com"
}
```

## Brevo Free Tier Limits

- **300 emails/day** (free tier)
- **Unlimited contacts**
- **Email templates**
- **SMTP & API access**

## Troubleshooting

### Error: "BREVO_API_KEY not set"
- **Fix:** Add `BREVO_API_KEY` to Render environment variables

### Error: "MAIL_FROM must be an email address"
- **Fix:** Change `MAIL_FROM` to an email address (e.g., `noreply@yourdomain.com`)

### Error: "Sender email not verified"
- **Fix:** Verify sender email in Brevo dashboard (Settings → Senders)

### Error: "API key invalid"
- **Fix:** Generate new API key in Brevo and update `BREVO_API_KEY`

## Render Dashboard Checklist

- [ ] Add `BREVO_API_KEY` environment variable
- [ ] Add `MAIL_FROM` environment variable (email address)
- [ ] Add `MAIL_FROM_NAME` environment variable (optional)
- [ ] Remove old `MAILERSEND_API_KEY` if exists
- [ ] Save changes
- [ ] Wait for redeploy
- [ ] Test with `/api/auth/test-email`

## Migration from MailerSend

### What Changed:
- ✅ Code updated to use Brevo SDK
- ✅ Package.json updated (`@getbrevo/brevo` instead of `mailersend`)
- ✅ Environment variable changed: `BREVO_API_KEY` instead of `MAILERSEND_API_KEY`
- ✅ Error messages updated

### What You Need to Do:
1. Get Brevo API key
2. Update Render environment variables
3. Verify sender email in Brevo
4. Redeploy service
5. Test endpoints

## Benefits of Brevo

- ✅ More reliable delivery
- ✅ Better free tier (300 emails/day)
- ✅ Easy to use API
- ✅ Good documentation
- ✅ Email templates support

