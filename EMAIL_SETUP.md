# Email Setup Guide

## Problem Fixed
The password reset emails were not being sent because email configuration was missing in the `.env` file.

## Email Configuration Added

The following environment variables have been added to `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

## Setup Instructions

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication on your Gmail account**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "App" → "Mail"
   - Select "Device" → "Other (Custom name)" → Enter "IDP Platform"
   - Click "Generate"
   - Copy the 16-character password (without spaces)

3. **Update `.env` file**
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Your 16-character app password
   ```

### Option 2: Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password  # Generate from Yahoo Account Security
```

#### Custom SMTP Server
```env
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=your-email@your-domain.com
EMAIL_PASSWORD=your-password
```

### Option 3: Test Mode (Ethereal)

If you don't provide `EMAIL_USER` and `EMAIL_PASSWORD`, the system will automatically use Ethereal (fake SMTP) for testing:
- Emails won't be sent to real addresses
- Preview URLs will be logged in the backend console
- Good for development/testing without real email setup

## After Configuration

1. **Update the `.env` file** with your email credentials
2. **Restart the backend server**:
   ```bash
   cd backend
   npm run start:dev
   ```
3. **Test forgot password**:
   - Go to http://localhost:3000/forgot-password
   - Enter a registered email
   - Check your inbox for the reset link

## Troubleshooting

### Gmail: "Less secure app access"
- **Solution**: Use App Password instead of your regular password (see Option 1 above)

### "Authentication failed"
- Verify email and password are correct
- For Gmail: Make sure you're using App Password, not regular password
- Check if 2FA is enabled (required for Gmail App Passwords)

### "Connection timeout"
- Check your firewall/antivirus settings
- Verify SMTP port (usually 587 or 465)
- Try different EMAIL_PORT values

### Emails going to spam
- Configure SPF/DKIM records (for production)
- Use a verified domain email
- Avoid trigger words in subject/body

## Security Notes

⚠️ **Important**:
- Never commit the `.env` file to Git (it's already in `.gitignore`)
- Use App Passwords instead of regular passwords when possible
- For production, use a professional email service (SendGrid, AWS SES, etc.)
- Store credentials securely in production environment variables

## Development vs Production

### Development
- Using Gmail App Password is fine
- FRONTEND_URL should be `http://localhost:3000`

### Production
- Use professional email service (SendGrid, AWS SES, Mailgun, etc.)
- Set FRONTEND_URL to your production domain: `https://your-domain.com`
- Use environment variables in your hosting platform
- Enable email tracking and analytics

## What's Fixed

✅ Email service is now properly configured  
✅ Password reset emails will be sent to real email addresses  
✅ Reset links include the correct frontend URL  
✅ Proper error handling and logging  
✅ Works with multiple email providers  
✅ Falls back to test mode if credentials not provided
