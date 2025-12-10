# Fix Send OTP API Issue

## Problem
Send OTP API is not working, but Check User API works fine.

## Possible Causes

1. **Missing MailerSend Environment Variables**
   - `MAILERSEND_API_KEY` not set
   - `MAIL_FROM` not set
   - `MAIL_FROM_NAME` not set (optional)

2. **User Email Missing**
   - User exists but doesn't have an email address

3. **MailerSend API Error**
   - Invalid API key
   - Domain not verified in MailerSend
   - API quota exceeded

## Step 1: Check Email Configuration

**Test the email configuration endpoint:**

```bash
GET https://dcs-coaching.onrender.com/api/auth/test-email
```

This will show:
- ✅ Which environment variables are set
- ❌ Which ones are missing
- Detailed error messages

**Expected Response (if configured correctly):**
```json
{
  "message": "MailerSend configuration valid",
  "config": {
    "MAILERSEND_API_KEY": "✅ Set",
    "MAIL_FROM": "noreply@yourdomain.com",
    "MAIL_FROM_NAME": "DCS Coaching"
  },
  "status": "ready"
}
```

**Expected Response (if missing config):**
```json
{
  "message": "MailerSend configuration incomplete",
  "config": {
    "MAILERSEND_API_KEY": "❌ Missing",
    "MAIL_FROM": "❌ Missing"
  },
  "error": "MAILERSEND_API_KEY is required"
}
```

## Step 2: Set Environment Variables in Render

1. **Go to Render Dashboard:**
   - Navigate to your Web Service
   - Click **"Environment"** tab

2. **Add Required Variables:**
   - `MAILERSEND_API_KEY` - Your MailerSend API key
   - `MAIL_FROM` - Your sender email (e.g., `noreply@yourdomain.com`)
   - `MAIL_FROM_NAME` - Sender name (optional, e.g., `DCS Coaching`)

3. **Save and Redeploy**

## Step 3: Verify User Has Email

**Check if user has email:**

```bash
GET https://dcs-coaching.onrender.com/api/auth/db-status
```

Look at `sampleUsers` array - check if users have email addresses.

**If user doesn't have email, update it:**

```sql
UPDATE users 
SET email = 'test@example.com' 
WHERE "uniqueId" = 'STU001';
```

## Step 4: Test Send OTP Again

After fixing configuration:

```bash
POST https://dcs-coaching.onrender.com/api/auth/send-otp
{
  "uniqueId": "STU001"
}
```

**Success Response:**
```json
{
  "message": "OTP sent successfully",
  "email": "test@example.com"
}
```

**Error Response (with debug info):**
```json
{
  "message": "Failed to send OTP",
  "error": "MailerSend API error",
  "debug": {
    "MAILERSEND_API_KEY": "✅ Set",
    "MAIL_FROM": "noreply@yourdomain.com",
    "userEmail": "test@example.com"
  }
}
```

## Step 5: Check Server Logs

If still failing, check Render logs for detailed error:
- Go to Render Dashboard → Your Web Service → Logs
- Look for: `❌ MailerSend error:`
- This will show the exact error from MailerSend API

## Common Issues & Solutions

### Issue 1: Missing MAILERSEND_API_KEY
**Symptom:** `MAILERSEND_API_KEY: ❌ Missing` in test-email response
**Fix:** 
1. Get API key from MailerSend dashboard
2. Add to Render environment variables
3. Redeploy

### Issue 2: Missing MAIL_FROM
**Symptom:** `MAIL_FROM: ❌ Missing` in test-email response
**Fix:**
1. Add `MAIL_FROM` to Render environment variables
2. Use verified domain email (e.g., `noreply@yourdomain.com`)
3. Redeploy

### Issue 3: User Email Missing
**Symptom:** `"User email not found"` error
**Fix:**
```sql
UPDATE users SET email = 'valid@email.com' WHERE "uniqueId" = 'STU001';
```

### Issue 4: MailerSend Domain Not Verified
**Symptom:** API error about unverified domain
**Fix:**
1. Go to MailerSend dashboard
2. Verify your sending domain
3. Add DNS records as instructed

### Issue 5: Invalid API Key
**Symptom:** 401 Unauthorized error
**Fix:**
1. Generate new API key in MailerSend
2. Update `MAILERSEND_API_KEY` in Render
3. Redeploy

## Quick Checklist

- [ ] Run `/api/auth/test-email` to check configuration
- [ ] Add `MAILERSEND_API_KEY` to Render environment variables
- [ ] Add `MAIL_FROM` to Render environment variables
- [ ] Verify user has email address in database
- [ ] Check Render logs for detailed errors
- [ ] Test send-otp endpoint again

## Get MailerSend API Key

1. Sign up/login at https://www.mailersend.com
2. Go to Settings → API Tokens
3. Create new token with "Email" permissions
4. Copy the token
5. Add to Render as `MAILERSEND_API_KEY`

## Debugging Flow

1. **Check config:** `GET /api/auth/test-email`
2. **Check database:** `GET /api/auth/db-status`
3. **Check user email:** Look at `sampleUsers` in db-status response
4. **Check logs:** Render Dashboard → Logs
5. **Fix issues** based on findings
6. **Test again:** `POST /api/auth/send-otp`

