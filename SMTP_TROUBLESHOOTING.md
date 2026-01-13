# SMTP Email Configuration Troubleshooting Guide

## Recent Fixes Applied ✅

### 1. Connection Pooling
- Enabled connection pooling to reuse SMTP connections
- Set max 5 connections with 100 messages per connection
- Rate limiting: 5 messages per second

### 2. Timeout Configuration
- Connection timeout: 60 seconds
- Greeting timeout: 30 seconds
- Socket timeout: 60 seconds

### 3. TLS Configuration
- Minimum TLS version: 1.2
- Reject unauthorized certificates disabled (for development)
- **⚠️ Important:** Set `rejectUnauthorized: true` in production with valid SSL certificates

### 4. Retry Logic
- Automatic retry on connection failures (3 attempts)
- Exponential backoff (2s, 4s, 6s delays)
- Connection re-verification before each retry
- Automatic transporter reinitialization if verification fails

### 5. Debug Logging
- Debug mode enabled in development
- Detailed logging for troubleshooting

## Common SMTP Providers Configuration

### Gmail (smtp.gmail.com)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password!
```

**Important for Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password (Google Account → Security → 2-Step Verification → App passwords)
3. Use the App Password in `SMTP_PASS`

### Gmail Alternative (with SSL)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
```

### SendGrid (smtp.sendgrid.net)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun (smtp.mailgun.org)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
```

### Amazon SES (email-smtp.region.amazonaws.com)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### Outlook/Office365 (smtp.office365.com)
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Mailtrap (smtp.mailtrap.io) - **RECOMMENDED FOR DEVELOPMENT**
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

**Alternative Mailtrap Ports:**
- Port 2525 (recommended)
- Port 25
- Port 465 (SSL)
- Port 587 (TLS)

**⚠️ Important for Mailtrap:**
1. Port 2525 is the most reliable for Mailtrap
2. Get credentials from: Mailtrap → Email Testing → Inboxes → Your Inbox → SMTP Settings
3. Use the username/password shown (not your Mailtrap account password)

## Troubleshooting Steps

### Error: "Connection closed unexpectedly"

**Possible Causes:**
1. ✅ **Fixed:** Connection timeout (now handled with retry logic)
2. Firewall blocking outbound SMTP ports
3. ISP blocking SMTP (some ISPs block port 25)
4. Invalid credentials
5. Gmail/provider security blocking the connection

**Solutions:**
1. Check if port 587 or 465 is open: 
   ```bash
   telnet smtp.gmail.com 587
   ```
2. For Gmail: Use App Password instead of regular password
3. Try different ports (587, 465, 25)
4. Check provider's security dashboard for blocked login attempts

### Error: "Authentication failed"

**Solutions:**
1. Verify credentials are correct
2. For Gmail: Use App Password
3. Enable "Less secure app access" (Gmail - not recommended, use App Password instead)
4. Check if account requires 2FA

### Error: "Connection timeout"

**Solutions:**
1. ✅ **Fixed:** Timeout increased to 60 seconds
2. Check network/firewall settings
3. Try different SMTP host (e.g., smtp-relay.gmail.com for Google Workspace)

## Testing Your SMTP Configuration

Run this test in your backend terminal:

```bash
# Using curl to test SMTP port
curl -v telnet://smtp.gmail.com:587

# Or using PowerShell on Windows
Test-NetConnection -ComputerName smtp.gmail.com -Port 587
```

## Monitoring Email Logs

Check the `email_logs` table in your database:

```sql
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Production Recommendations

1. **Use a Professional Email Service**
   - SendGrid (12,000 free emails/month)
   - Mailgun (5,000 free emails/month)
   - Amazon SES (62,000 free emails/month for EC2-hosted apps)

2. **Update TLS Settings**
   - Set `rejectUnauthorized: true` in production
   - Obtain valid SSL certificates

3. **Environment Variables**
   - Never commit `.env` file
   - Use secure secret management (AWS Secrets Manager, Azure Key Vault)

4. **Rate Limiting**
   - Current: 5 messages per second
   - Adjust based on your provider's limits

5. **Monitor Email Delivery**
   - Set up alerts for failed emails
   - Monitor the `email_logs` table
   - Track delivery rates

## Current Status

The backend now has:
- ✅ Connection pooling
- ✅ Automatic retry with exponential backoff
- ✅ Extended timeouts
- ✅ Connection re-verification
- ✅ Debug logging
- ✅ Comprehensive error handling

**Next Steps:**
1. Verify your SMTP credentials in `.env`
2. If using Gmail, generate and use an App Password
3. Test by triggering an OTP email
4. Check logs for detailed error messages
5. Monitor `email_logs` table for delivery status
