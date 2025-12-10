# Debug MailerSend Undefined Error

## Current Status
- ✅ `MAIL_FROM` is now correct: `admin94428@gmail.com`
- ❌ Error is showing as `undefined`

## Possible Causes

### 1. MailerSend Domain Not Verified
MailerSend requires you to verify your sending domain. If using `admin94428@gmail.com`, this might not be verified.

**Solution:**
- Go to MailerSend Dashboard → Domains
- Add and verify your domain
- Or use MailerSend's test domain for testing

### 2. Invalid API Key
The API key might be invalid or expired.

**Check:**
- Go to MailerSend Dashboard → Settings → API Tokens
- Verify the API key is active
- Generate a new one if needed

### 3. Sender Email Not Verified
The email `admin94428@gmail.com` needs to be verified in MailerSend.

**Solution:**
- MailerSend Dashboard → Senders
- Add and verify `admin94428@gmail.com`
- Or use a verified domain email

### 4. MailerSend SDK Version Issue
The error structure might be different in the SDK version you're using.

## Next Steps After Code Update

The updated code will now:
1. ✅ Validate Sender object creation
2. ✅ Log more details before sending
3. ✅ Show MailerSend response
4. ✅ Better error extraction

## Check Render Logs

After redeploying, check Render logs for:
- `✅ Sender created:` - Confirms Sender object is valid
- `📤 Preparing to send email:` - Shows email details
- `📤 Sending email via MailerSend...` - Confirms API call started
- `❌ MailerSend error:` - Shows detailed error

## Quick Fixes to Try

### Option 1: Verify Domain in MailerSend
1. Go to MailerSend Dashboard
2. Add your domain (if using custom domain)
3. Add DNS records
4. Verify domain

### Option 2: Use MailerSend Test Domain
1. Check MailerSend dashboard for test email addresses
2. Use one of those for `MAIL_FROM`

### Option 3: Verify Sender Email
1. MailerSend Dashboard → Senders
2. Add `admin94428@gmail.com`
3. Verify it

### Option 4: Check API Key Permissions
1. MailerSend Dashboard → Settings → API Tokens
2. Ensure token has "Email" permissions
3. Generate new token if needed

## Test After Fix

```bash
POST https://dcs-coaching.onrender.com/api/auth/send-otp
{
  "uniqueId": "STU001"
}
```

Check logs for detailed error information.

