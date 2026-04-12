/**
 * LoginPage — OTP-based login/signup
 * Step 1: Enter email/phone
 * Step 2: Enter OTP
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TAGLINES = [
  "Where Monday energy meets Friday vibes.",
  "Surviving capitalism, one post at a time.",
  "The feed your manager doesn't know about.",
  "Professional by day. Unhinged by night.",
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState('email');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagline] = useState(TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { contact, type: contactType });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        contact,
        otp,
        type: contactType,
      });

      login(res.data.token, res.data.user);

      if (res.data.user.isNewUser) {
        navigate('/complete-profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center p-4">
      {/* Background noise texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '100px 100px',
        }}
      />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl">💼🍺</span>
          </div>
          <h1 className="font-display text-4xl font-black text-gold-400 tracking-tight mb-2">
            Drinkedin
          </h1>
          <p className="text-gray-400 text-sm font-body italic">{tagline}</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {step === 1 ? (
            <>
              <h2 className="font-display text-2xl text-white mb-1">Welcome back 🥂</h2>
              <p className="text-gray-500 text-sm mb-6">
                Sign in or create an account — no password needed
              </p>

              <form onSubmit={handleSendOTP} className="space-y-5">
                {/* Toggle email / phone */}
                <div className="flex bg-navy-800 rounded-xl p-1 gap-1">
                  {['email', 'sms'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setContactType(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        contactType === t
                          ? 'bg-gold-600 text-navy-900'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t === 'email' ? '📧 Email' : '📱 Phone'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    {contactType === 'email' ? 'Work email' : 'Phone number'}
                  </label>
                  <input
                    type={contactType === 'email' ? 'email' : 'tel'}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={
                      contactType === 'email'
                        ? 'you@company.com'
                        : '+91 9876543210'
                    }
                    className="input"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !contact}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending... 🍺' : 'Send OTP →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                className="text-gold-600 text-sm mb-4 hover:text-gold-400 transition-colors"
              >
                ← Back
              </button>

              <h2 className="font-display text-2xl text-white mb-1">Check your {contactType === 'email' ? 'inbox' : 'messages'} 🍻</h2>
              <p className="text-gray-500 text-sm mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-gold-400 font-medium text-sm mb-6">{contact}</p>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="input text-center text-3xl font-mono tracking-[1rem] py-4"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-gray-600 text-xs mt-2 text-center">
                    Valid for 10 minutes
                  </p>
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Enter 🍺'}
                </button>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors"
                >
                  Didn't get it? Resend OTP
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By signing in, you agree to not blame us for your liver. 🥂
        </p>
      </div>
    </div>
  );
}
