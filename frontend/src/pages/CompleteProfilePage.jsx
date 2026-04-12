/**
 * CompleteProfilePage — shown once after first OTP verification
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const PERSONAS = [
  'Burnt Out Dev', 'Chaos Manager', 'QA Ghost', 'HR Spy',
  'The Intern', 'CTO (Chief Tequila Officer)', 'Senior Slack Sender',
];

export default function CompleteProfilePage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    alias: '',
    jobTitle: '',
    company: '',
    bio: '',
    corporatePersona: 'Burnt Out Dev',
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/complete-profile', form);
      updateUser(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <span className="text-4xl">🎉</span>
          <h1 className="font-display text-3xl text-gold-400 mt-2 mb-1">Set up your Drinkedin profile</h1>
          <p className="text-gray-500 text-sm">You can be as anonymous as you like</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Username *</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="burnt_dev_raj"
                className="input"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
              />
              <p className="text-gray-600 text-xs mt-1">Letters, numbers, underscores</p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Display alias</label>
              <input
                name="alias"
                value={form.alias}
                onChange={handleChange}
                placeholder="Raj (Probably Debugging)"
                className="input"
                maxLength={30}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Job title</label>
              <input name="jobTitle" value={form.jobTitle} onChange={handleChange} placeholder="Senior Sufferer" className="input" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Company</label>
              <input name="company" value={form.company} onChange={handleChange} placeholder="TechCorp" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="I write code. Code breaks. I drink. Repeat."
              className="textarea"
              rows={2}
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Corporate Persona 🎭</label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONAS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, corporatePersona: p }))}
                  className={`px-3 py-2 rounded-xl text-sm transition-all duration-150 text-left ${
                    form.corporatePersona === p
                      ? 'bg-gold-600 text-navy-900 font-semibold'
                      : 'bg-navy-700 text-gray-400 hover:text-gold-400 border border-navy-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                form.isPrivate ? 'bg-gold-600' : 'bg-navy-600'
              }`}
              onClick={() => setForm((f) => ({ ...f, isPrivate: !f.isPrivate }))}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.isPrivate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
            <div>
              <p className="text-gray-200 text-sm font-medium">Private account</p>
              <p className="text-gray-500 text-xs">Posts visible to approved followers only</p>
            </div>
          </label>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !form.username}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Enter Drinkedin 🍺'}
          </button>
        </form>
      </div>
    </div>
  );
}
