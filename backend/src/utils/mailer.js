const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Mailer connection error:', error.message);
  } else {
    console.log('✅ Mailer is ready to send emails');
  }
});

/**
 * Send a password reset email.
 * @param {string} toEmail - recipient email address
 * @param {string} resetLink - full reset URL including token
 */
const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const mailOptions = {
    from: `"Smart Inventory System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">Smart Inventory System</h2>
        <h3 style="color: #111827; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #6b7280; line-height: 1.6;">
          We received a request to reset the password for your account. Click the button below to set a new password.
          This link will expire in <strong>15 minutes</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" 
             style="background-color: #4f46e5; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Reset My Password
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="color: #d1d5db; font-size: 12px; text-align: center;">Smart Inventory &amp; Billing System</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
