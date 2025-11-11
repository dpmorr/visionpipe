import nodemailer from 'nodemailer';

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

export async function sendInviteEmail(
  to: string,
  organizationName: string,
  inviteToken: string,
  role: string
) {
  const inviteUrl = `${process.env.APP_URL || 'http://localhost:5000'}/join/${inviteToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER, // Fallback to SMTP_USER if SMTP_FROM not set
    to,
    subject: `Invitation to join ${organizationName} on wastetraq`,
    html: `
      <h2>You've been invited to join ${organizationName}</h2>
      <p>You've been invited to join ${organizationName} on wastetraq as a ${role}.</p>
      <p>Click the link below to accept the invitation and create your account:</p>
      <p><a href="${inviteUrl}" style="padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
      <p>Or copy and paste this link in your browser:</p>
      <p>${inviteUrl}</p>
      <p>This invitation will expire in 7 days.</p>
    `,
  };

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    await transporter.sendMail(mailOptions);
    console.log('Invite email sent successfully to:', to);
  } catch (error) {
    console.error('Failed to send invite email:', error);
    throw new Error('Failed to send invite email');
  }
}