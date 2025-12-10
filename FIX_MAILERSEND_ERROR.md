# Fix MailerSend Error - MAIL_FROM Issue

## Problem Identified

The error shows:
```json
{
  "MAIL_FROM": "DCS Coaching"
}
```

**This is WRONG!** `MAIL_FROM` must be an **email address**, not a name.

## Root Cause

`MAIL_FROM` is set to `"DCS Coaching"` (a name) instead of an email address like `"noreply@yourdomain.com"`.

## Fix: Update Render Environment Variables

### Step 1: Go to Render Dashboard
1. Navigate to your **Web Service**
2. Click **"Environment"** tab

### Step 2: Fix MAIL_FROM Variable

**Current (WRONG):**
```
MAIL_FROM = DCS Coaching
```

**Fixed (CORRECT):**
```
MAIL_FROM = noreply@yourdomain.com
```

**Important:**
- Must be a valid email address
- Must be verified in MailerSend
- Use your domain email (e.g., `noreply@dcs-coaching.com`)

### Step 3: Set MAIL_FROM_NAME (Optional)

If you want the sender name to be "DCS Coaching", set:
```
MAIL_FROM_NAME = DCS Coaching
```

But `MAIL_FROM` must still be an email address!

### Step 4: Verify MailerSend Domain

1. Go to MailerSend Dashboard
2. Go to **Domains** → **Add Domain**
3. Add your domain (e.g., `dcs-coaching.com`)
4. Add DNS records as instructed
5. Verify domain

### Step 5: Use Verified Email

After domain is verified, use an email from that domain:
```
MAIL_FROM = noreply@dcs-coaching.com
```

Or if using a different domain:
```
MAIL_FROM = noreply@yourdomain.com
```

## Complete Environment Variables Setup

In Render, set these:

```
MAILERSEND_API_KEY = your-mailersend-api-key
MAIL_FROM = noreply@yourdomain.com          ← EMAIL ADDRESS (required)
MAIL_FROM_NAME = DCS Coaching                ← NAME (optional)
```

## After Fixing

1. **Save** environment variables in Render
2. **Redeploy** your service (or wait for auto-redeploy)
3. **Test again:**
   ```bash
   POST https://dcs-coaching.onrender.com/api/auth/send-otp
   {
     "uniqueId": "STU001"
   }
   ```

## Verify Configuration

Test email config:
```bash
GET https://dcs-coaching.onrender.com/api/auth/test-email
```

Should show:
```json
{
  "config": {
    "MAILERSEND_API_KEY": "✅ Set",
    "MAIL_FROM": "noreply@yourdomain.com",
    "MAIL_FROM_IS_EMAIL": "✅ Valid"
  }
}
```

## Common Mistakes

### ❌ Wrong:
```
MAIL_FROM = DCS Coaching
MAIL_FROM = noreply
MAIL_FROM = your-name
```

### ✅ Correct:
```
MAIL_FROM = noreply@dcs-coaching.com
MAIL_FROM = hello@yourdomain.com
MAIL_FROM = support@yourdomain.com
```

## If You Don't Have a Domain

1. **Use MailerSend Test Domain** (for testing):
   - MailerSend provides test domains
   - Check MailerSend dashboard for test email addresses

2. **Or Use Your Personal Email** (temporary):
   ```
   MAIL_FROM = your-email@gmail.com
   ```
   Note: Some email providers may block this

3. **Best Practice:** Get a domain and verify it in MailerSend

## Quick Fix Checklist

- [ ] Go to Render → Environment tab
- [ ] Change `MAIL_FROM` from "DCS Coaching" to an email address
- [ ] Set `MAIL_FROM_NAME = DCS Coaching` (optional, for sender name)
- [ ] Verify domain in MailerSend (if using custom domain)
- [ ] Save and redeploy
- [ ] Test send-otp endpoint again

