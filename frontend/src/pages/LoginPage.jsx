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
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="orb w-96 h-96 bg-gold-600/20 top-[-10%] left-[-10%] animate-float" />
      <div className="orb w-80 h-80 bg-purple-600/10 bottom-[-5%] right-[-5%] animate-float-delayed" />
      <div className="orb w-64 h-64 bg-blue-600/8 top-[40%] right-[10%] animate-float" />

      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '100px 100px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl animate-float drop-shadow-lg">💼🍺</span>
          </div>
          <h1 className="font-display text-5xl font-black text-gradient-gold tracking-tight mb-3">
            Drinkedin
          </h1>
          <p className="text-gray-400 text-sm font-body italic max-w-xs mx-auto">{tagline}</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 animate-scale-in">
          {step === 1 ? (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl text-white mb-1">Welcome back 🥂</h2>
              <p className="text-gray-500 text-sm mb-6">
                Sign in or create an account — no password needed
              </p>

              <form onSubmit={handleSendOTP} className="space-y-5">
                {/* Toggle email / phone */}
                <div className="flex bg-navy-800/80 rounded-xl p-1 gap-1">
                  {['email', 'sms'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setContactType(t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        contactType === t
                          ? 'bg-gold-gradient text-navy-900 shadow-gold'
                          : 'text-gray-400 hover:text-white hover:bg-navy-700/50'
                      }`}
                    >
                      {t === 'email' ? '📧 Email' : '📱 Phone'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">
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
                    className="input py-3.5"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !contact}
                  className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : 'Send OTP →'}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-slide-up">
              <button
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                className="text-gold-600 text-sm mb-4 hover:text-gold-400 transition-colors flex items-center gap-1 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
              </button>

              <h2 className="font-display text-2xl text-white mb-1">Check your {contactType === 'email' ? 'inbox' : 'messages'} 🍻</h2>
              <p className="text-gray-500 text-sm mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-gold-400 font-medium text-sm mb-6">{contact}</p>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="input text-center text-3xl font-mono tracking-[1rem] py-5 bg-navy-800/80 border-navy-500"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-gray-600 text-xs mt-2 text-center">
                    Valid for 10 minutes
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : 'Verify & Enter 🍺'}
                </button>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="w-full text-gray-500 text-sm hover:text-gold-400 transition-colors py-2"
                >
                  Didn't get it? Resend OTP
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 animate-fade-in">
          By signing in, you agree to not blame us for your liver. 🥂
        </p>
      </div>
    </div>
  );
}
