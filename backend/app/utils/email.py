import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_smtp_email(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
    """
    Sends an email using the SMTP settings configured in the application.
    If settings.smtp_host is not configured, email contents will be logged to the console
    to facilitate local development.
    """
    if not settings.smtp_host:
        logger.warning(
            "SMTP Host is not configured (HRMS_SMTP_HOST is None/empty).\n"
            "Email logging fallback active:\n"
            "-----------------------------------------\n"
            "To: %s\n"
            "Subject: %s\n"
            "Body (Plain Text):\n%s\n"
            "-----------------------------------------",
            to_email,
            subject,
            text_content or "HTML Content only",
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Connect to the SMTP server
        # Port 465 is typically SSL, 587 or 25 are typically STARTTLS
        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()

        # Login if user/password are provided
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)

        # Send the mail
        server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())
        server.quit()

        logger.info("Successfully sent email to %s with subject: %s", to_email, subject)
        return True
    except Exception as e:
        logger.error(
            "Failed to send email to %s via SMTP server %s:%s. Error: %s",
            to_email,
            settings.smtp_host,
            settings.smtp_port,
            str(e),
            exc_info=True
        )
        return False


def send_welcome_email(to_email: str, full_name: str) -> bool:
    """
    Sends a welcome email to the user upon successful registration.
    """
    subject = "Welcome to PeopleFlow!"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                color: #334155;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: #ffffff;
                padding: 40px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.05em;
            }}
            .content {{
                padding: 40px 30px;
                line-height: 1.6;
            }}
            .content p {{
                margin-top: 0;
                margin-bottom: 20px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                background-color: #2563eb;
                color: #ffffff !important;
                text-decoration: none;
                padding: 12px 30px;
                font-weight: 600;
                border-radius: 6px;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
            }}
            .footer {{
                background-color: #f1f5f9;
                color: #64748b;
                text-align: center;
                padding: 20px;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to PeopleFlow</h1>
            </div>
            <div class="content">
                <p>Hello {full_name},</p>
                <p>Thank you for registering an account on PeopleFlow HRMS! Your account has been successfully created.</p>
                <p>You can now log in to the dashboard to request leaves, view your attendance history, check reports, and manage your profile settings.</p>
                <div class="button-container">
                    <a href="{settings.frontend_url}/login" class="button">Log In to Your Account</a>
                </div>
                <p>If you have any questions or require assistance, please feel free to reach out to the HR department.</p>
                <p>Best Regards,<br>The PeopleFlow Team</p>
            </div>
            <div class="footer">
                &copy; 2026 PeopleFlow. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = (
        f"Hello {full_name},\n\n"
        f"Thank you for registering an account on PeopleFlow HRMS! Your account has been successfully created.\n\n"
        f"You can now log in to your account at: {settings.frontend_url}/login\n\n"
        f"Best Regards,\nThe PeopleFlow Team"
    )
    
    return send_smtp_email(to_email, subject, html_content, text_content)


def send_password_reset_email(to_email: str, full_name: str, reset_link: str) -> bool:
    """
    Sends a password reset email containing a link back to the frontend.
    """
    subject = "Reset Your PeopleFlow Password"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                color: #334155;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #e11d48, #be123c);
                color: #ffffff;
                padding: 40px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.05em;
            }}
            .content {{
                padding: 40px 30px;
                line-height: 1.6;
            }}
            .content p {{
                margin-top: 0;
                margin-bottom: 20px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                background-color: #e11d48;
                color: #ffffff !important;
                text-decoration: none;
                padding: 12px 30px;
                font-weight: 600;
                border-radius: 6px;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.2);
            }}
            .footer {{
                background-color: #f1f5f9;
                color: #64748b;
                text-align: center;
                padding: 20px;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
            }}
            .warning {{
                background-color: #fffbeb;
                border: 1px solid #fef3c7;
                color: #b45309;
                padding: 15px;
                border-radius: 6px;
                margin-top: 20px;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reset Your Password</h1>
            </div>
            <div class="content">
                <p>Hello {full_name},</p>
                <p>We received a request to reset your password for your PeopleFlow HRMS account. If you made this request, please click the button below to set a new password:</p>
                <div class="button-container">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </div>
                <p>This password reset link will expire in 1 hour.</p>
                <div class="warning">
                    If you did not request a password reset, please ignore this email or contact support if you have concerns about your account security.
                </div>
                <p>Best Regards,<br>The PeopleFlow Team</p>
            </div>
            <div class="footer">
                &copy; 2026 PeopleFlow. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = (
        f"Hello {full_name},\n\n"
        f"We received a request to reset your password for your PeopleFlow HRMS account.\n\n"
        f"Please reset your password by copying and pasting the following link into your browser:\n"
        f"{reset_link}\n\n"
        f"This link will expire in 1 hour.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Best Regards,\nThe PeopleFlow Team"
    )
    
    return send_smtp_email(to_email, subject, html_content, text_content)


def send_verification_email(to_email: str, full_name: str, verification_link: str) -> bool:
    """
    Sends a verification email containing a link back to the frontend to verify the account.
    """
    subject = "Verify Your PeopleFlow Email Address"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                color: #334155;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #4f46e5, #3730a3);
                color: #ffffff;
                padding: 40px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.05em;
            }}
            .content {{
                padding: 40px 30px;
                line-height: 1.6;
            }}
            .content p {{
                margin-top: 0;
                margin-bottom: 20px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                background-color: #4f46e5;
                color: #ffffff !important;
                text-decoration: none;
                padding: 12px 30px;
                font-weight: 600;
                border-radius: 6px;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            }}
            .footer {{
                background-color: #f1f5f9;
                color: #64748b;
                text-align: center;
                padding: 20px;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
            }}
            .info {{
                background-color: #eff6ff;
                border: 1px solid #dbeafe;
                color: #1e40af;
                padding: 15px;
                border-radius: 6px;
                margin-top: 20px;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Verify Your Email</h1>
            </div>
            <div class="content">
                <p>Hello {full_name},</p>
                <p>Thank you for registering on PeopleFlow! Before we can get started, we need you to verify your email address by clicking the button below:</p>
                <div class="button-container">
                    <a href="{verification_link}" class="button">Verify Email Address</a>
                </div>
                <p>This verification link will expire in 24 hours.</p>
                <div class="info">
                    If you did not create an account on PeopleFlow, you can safely ignore this email.
                </div>
                <p>Best Regards,<br>The PeopleFlow Team</p>
            </div>
            <div class="footer">
                &copy; 2026 PeopleFlow. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = (
        f"Hello {full_name},\n\n"
        f"Thank you for registering on PeopleFlow! Please verify your email address by visiting the following link:\n"
        f"{verification_link}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"Best Regards,\nThe PeopleFlow Team"
    )
    
    return send_smtp_email(to_email, subject, html_content, text_content)

