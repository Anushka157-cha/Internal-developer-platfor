import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private transporterReady: Promise<void>;

  constructor(private configService: ConfigService) {
    const user = this.configService.get('EMAIL_USER');
    const pass = this.configService.get('EMAIL_PASSWORD');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
        port: this.configService.get('EMAIL_PORT', 587),
        secure: false, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.transporterReady = Promise.resolve();
    } else {
      // No SMTP credentials provided — create an Ethereal test account for local development
      this.transporterReady = (async () => {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.warn('EMAIL_USER/PASSWORD not set — using Ethereal test account for emails.');
      })();
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"IDP Platform" <${this.configService.get('EMAIL_USER')}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password for your IDP Platform account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2026 IDP Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        You requested to reset your password for your IDP Platform account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
      `,
    };

    try {
      // Ensure transporter is initialized (important for Ethereal async init)
      if (this.transporterReady) await this.transporterReady;

      const info = await this.transporter.sendMail(mailOptions);

      // If using Ethereal, log the preview URL so developers can open the message
      try {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.info('Preview URL:', previewUrl);
          return { success: true, previewUrl };
        }
      } catch (_) {
        // ignore
      }

      return { success: true };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    const mailOptions = {
      from: `"IDP Platform" <${this.configService.get('EMAIL_USER')}>`,
      to,
      subject: 'Welcome to IDP Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to IDP Platform!</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Welcome to IDP Platform! Your account has been successfully created.</p>
              <p>You can now login and start managing your services, deployments, and feature flags.</p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Happy deploying!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Welcome email sending failed:', error);
      // Don't throw error for welcome email
    }
  }
}
