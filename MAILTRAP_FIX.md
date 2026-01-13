# Mailtrap SMTP Configuration Fix

## Current Issue

Your backend is using Mailtrap (`smtp.mailtrap.io`) but experiencing TLS handshake errors:
```
Error: read ECONNRESET
```

This happens when the TLS negotiation fails during the STARTTLS command.

## Root Cause

Mailtrap has multiple ports with different security protocols, and the current port configuration is causing TLS handshake failures.

## ✅ SOLUTION: Update Your .env File

Change your SMTP port from the current value to **port 2525** (Mailtrap's recommended port):

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=<your-mailtrap-username>
SMTP_PASS=<your-mailtrap-password>
```

## Where to Find Your Mailtrap Credentials

1. Go to https://mailtrap.io
2. Log in to your account
3. Navigate to: **Email Testing** → **Inboxes** → Select your inbox
4. Click on **SMTP Settings**
5. Copy the **Username** and **Password** shown there (NOT your Mailtrap account password)

## Alternative Port Options (if 2525 doesn't work)

Try these in order:

### Option 1: Port 2525 (RECOMMENDED)
```env
SMTP_PORT=2525
SMTP_SECURE=false
```

### Option 2: Port 587 with TLS
```env
SMTP_PORT=587
SMTP_SECURE=false
```

### Option 3: Port 465 with SSL
```env
SMTP_PORT=465
SMTP_SECURE=true
```

### Option 4: Port 25
```env
SMTP_PORT=25
SMTP_SECURE=false
```

## Testing the Fix

After updating your `.env` file:

1. **Restart your backend** (the dev server should auto-restart)

2. **Trigger an OTP email** by attempting to register or login

3. **Check the terminal logs** for:
   - ✅ Success: `Email sent successfully to [email]`
   - ❌ Failure: Check the debug logs for more details

4. **Check Mailtrap inbox**: If successful, you'll see the email in your Mailtrap inbox

## What Was Fixed in the Code

✅ Added connection pooling  
✅ Added automatic retry with exponential backoff (3 attempts)  
✅ Extended timeouts (60 seconds)  
✅ Connection re-verification before retries  
✅ Enhanced debug logging  
✅ TLS configuration improvements  

## Example Terminal Output (Success)

You should see something like:
```
[Nest] 25776  - 13/01/2026, 02:10:15     LOG [MailerService] SMTP transporter is ready
🔐 OTP FOR eddykilonzo10@gmail.com: 123456
[Nest] 25776  - 13/01/2026, 02:10:16     LOG [MailerService] Email sent successfully to eddykilonzo10@gmail.com
```

## Still Having Issues?

If changing the port doesn't work:

### 1. Verify Mailtrap Credentials
```bash
# Make sure you're using the SMTP credentials from Mailtrap, not your account password
```

### 2. Check Network/Firewall
```powershell
# Test if you can reach Mailtrap
Test-NetConnection -ComputerName smtp.mailtrap.io -Port 2525
```

### 3. Try Without TLS (Temporary Test)
In your `.env`:
```env
SMTP_PORT=25
SMTP_SECURE=false
```

### 4. Check Email Logs Database
```sql
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 5;
```

## Production Alternative

**⚠️ Important:** Mailtrap is only for development/testing. For production, use:

- **SendGrid** (12,000 free emails/month)
- **Mailgun** (5,000 free emails/month)  
- **Amazon SES** (62,000 free emails/month)
- **Postmark** (100 free emails/month)

## Quick Action Items

1. [ ] Update `.env` file with `SMTP_PORT=2525`
2. [ ] Verify Mailtrap credentials are correct
3. [ ] Restart backend (if not auto-restarted)
4. [ ] Test by triggering an OTP email
5. [ ] Check Mailtrap inbox for the email
6. [ ] Review terminal logs for success/errors

---

**Need Help?** Check `SMTP_TROUBLESHOOTING.md` for more detailed troubleshooting steps.
