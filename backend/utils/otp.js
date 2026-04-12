/**
 * OTP Utility
 * Supports email (Maileroo HTTP API) and SMS (Twilio) delivery
 */

const bcrypt = require('bcryptjs');

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP for secure storage
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

// Verify OTP against hash
const verifyOTP = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};

// ─── Email OTP via Maileroo HTTP API (free, 3000/month, any recipient) ───────
const sendEmailOTP = async (email, otp) => {
  const apiKey = process.env.MAILEROO_API_KEY;
  console.log(`📧 Sending OTP to ${email} via Maileroo API`);
  console.log(`   API Key starts with: ${apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING'}, length: ${apiKey ? apiKey.length : 0}`);

  const formData = new FormData();
  formData.append('from', `Drinkedin <noreply@${process.env.MAILEROO_DOMAIN}>`);
  formData.append('to', email);
  formData.append('subject', 'Your Drinkedin OTP — Drink Responsibly (Verify First)');
  formData.append('html', `
    <div style="font-family: Georgia, serif; background: #0a0f1e; color: #f0c040; padding: 40px; border-radius: 12px; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 28px; margin-bottom: 8px;">Drinkedin</h1>
      <p style="color: #ccc; font-size: 14px;">LinkedIn by Day, Drinkedin by Night</p>
      <hr style="border-color: #f0c040; opacity: 0.2; margin: 24px 0;" />
      <p style="color: #eee; font-size: 16px;">Your verification code:</p>
      <div style="background: #1a2040; border: 2px solid #f0c040; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
        <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #f0c040;">${otp}</span>
      </div>
      <p style="color: #999; font-size: 13px;">Valid for 10 minutes. Don't share this with your manager.</p>
    </div>
  `);

  const res = await fetch('https://smtp.maileroo.com/send', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.MAILEROO_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Maileroo error:', errBody);
    throw new Error(errBody || 'Failed to send email');
  }

  console.log(`✅ OTP email sent to ${email}`);
};

// ─── SMS OTP ──────────────────────────────────────────────────────────────────
const sendSMSOTP = async (phone, otp) => {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Drinkedin OTP: ${otp} — Valid for 10 minutes. Cheers!`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

// ─── Main send function ───────────────────────────────────────────────────────
const sendOTP = async (contact, type = 'email') => {
  const otp = generateOTP();
  const hash = await hashOTP(otp);
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (type === 'email') {
    await sendEmailOTP(contact, otp);
  } else if (type === 'sms') {
    await sendSMSOTP(contact, otp);
  } else {
    throw new Error('Invalid OTP method');
  }

  return { hash, expiry };
};

module.exports = { generateOTP, hashOTP, verifyOTP, sendOTP };
