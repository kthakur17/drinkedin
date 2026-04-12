/**
 * CreatePost — unified post composer
 * Supports: text, image upload, meme generator, anonymous toggle
 */

import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const POST_TYPES = [
  { id: 'text',  label: 'Post',      emoji: '✍️' },
  { id: 'image', label: 'Photo',     emoji: '🖼️' },
  { id: 'meme',  label: 'Meme',      emoji: '😂' },
];

const MEME_TEMPLATES = [
  { id: 'standup',        label: 'Standup Meeting',  emoji: '☕' },
  { id: 'production_bug', label: 'Production Bug',   emoji: '🚨' },
  { id: 'deadline_panic', label: 'Deadline Panic',   emoji: '⏰' },
  { id: 'client_call',    label: 'Client Call',      emoji: '📞' },
];

export default function CreatePost({ onPostCreated, groupSlug = null }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState('text');
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [memeTemplate, setMemeTemplate] = useState('standup');
  const [memeTop, setMemeTop] = useState('');
  const [memeBottom, setMemeBottom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [badgesEarned, setBadgesEarned] = useState([]);
  const fileRef = useRef(null);

  const PROMPTS = [
    "Survived 5 meetings that could've been emails... 🍻",
    "Hot take: the real standup should be at a bar.",
    "Rate your day: 🍵 to 🥃",
    "What's the most unhinged thing your manager said this week?",
    "Confession: I have X browser tabs open and 0 are work-related.",
  ];
  const [placeholder] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setText('');
    setIsAnonymous(false);
    setImageFile(null);
    setImagePreview(null);
    setMemeTop('');
    setMemeBottom('');
    setType('text');
    setExpanded(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && type !== 'image' && type !== 'meme') return;
    setLoading(true);
    setError('');
    setBadgesEarned([]);

    try {
      const formData = new FormData();
      formData.append('type', type);
      if (text) formData.append('text', text);
      formData.append('isAnonymous', isAnonymous);
      if (groupSlug) formData.append('group', groupSlug);
      if (type === 'meme') {
        formData.append('memeTemplate', memeTemplate);
        formData.append('memeTopCaption', memeTop);
        formData.append('memeBottomCaption', memeBottom);
      }
      if (type === 'image' && imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onPostCreated?.(res.data.post);
      if (res.data.newBadges?.length > 0) {
        setBadgesEarned(res.data.newBadges);
        setTimeout(() => setBadgesEarned([]), 5000);
      }
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 mb-4">
      {/* Badge earned toast */}
      {badgesEarned.length > 0 && (
        <div className="bg-gold-900/30 border border-gold-700/40 rounded-xl p-3 mb-4 animate-slide-up">
          {badgesEarned.map((b) => (
            <p key={b.id} className="text-gold-400 text-sm font-medium">
              🏆 New Badge: {b.emoji} {b.name} — {b.description}
            </p>
          ))}
        </div>
      )}

      {/* Collapsed trigger */}
      {!expanded ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : '👤'}
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 text-left bg-navy-800 hover:bg-navy-700 border border-navy-600 hover:border-navy-500 rounded-xl px-4 py-3 text-gray-500 text-sm transition-all"
          >
            {placeholder}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="animate-fade-in">
          {/* Type selector */}
          <div className="flex gap-2 mb-4">
            {POST_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  type === t.id
                    ? 'bg-gold-gradient text-navy-900 font-semibold'
                    : 'bg-navy-700 text-gray-400 hover:text-white border border-navy-600'
                }`}
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Text input */}
          {(type === 'text' || type === 'image') && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              className="textarea mb-3 text-sm"
              rows={3}
              maxLength={2000}
              autoFocus
            />
          )}

          {/* Image upload */}
          {type === 'image' && (
            <div className="mb-3">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} className="rounded-xl max-h-56 w-full object-cover" alt="preview" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); fileRef.current.value = ''; }}
                    className="absolute top-2 right-2 bg-navy-900/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-900/80 transition-colors"
                  >×</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-navy-600 hover:border-gold-700 rounded-xl py-8 text-center text-gray-500 hover:text-gray-300 transition-all"
                >
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-sm">Click to upload image</p>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          )}

          {/* Meme Generator */}
          {type === 'meme' && (
            <div className="mb-3 space-y-3">
              {/* Template selector */}
              <div>
                <p className="text-gray-400 text-xs mb-2">Template</p>
                <div className="grid grid-cols-2 gap-2">
                  {MEME_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMemeTemplate(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        memeTemplate === t.id
                          ? 'bg-gold-gradient text-navy-900 font-semibold'
                          : 'bg-navy-700 text-gray-400 hover:text-white border border-navy-600'
                      }`}
                    >
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Captions */}
              <input
                value={memeTop}
                onChange={(e) => setMemeTop(e.target.value)}
                placeholder="Top caption (e.g. QA: Found 47 bugs)"
                className="input text-sm"
                maxLength={100}
              />
              <input
                value={memeBottom}
                onChange={(e) => setMemeBottom(e.target.value)}
                placeholder="Bottom caption (e.g. Dev: Those are features)"
                className="input text-sm"
                maxLength={100}
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Optional caption..."
                className="textarea text-sm"
                rows={2}
              />

              {/* Live Preview */}
              <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${
                { standup: 'from-blue-900', production_bug: 'from-red-900', deadline_panic: 'from-orange-900', client_call: 'from-green-900' }[memeTemplate] || 'from-navy-800'
              } to-navy-900 min-h-[150px] flex flex-col items-center justify-between p-3`}>
                <p className="text-gray-500 text-xs self-start font-mono">Preview</p>
                {memeTop && <p className="meme-caption text-white text-base font-black text-center uppercase w-full">{memeTop}</p>}
                <span className="text-5xl py-2">
                  {memeTemplate === 'standup' && '☕'}
                  {memeTemplate === 'production_bug' && '🐛'}
                  {memeTemplate === 'deadline_panic' && '😱'}
                  {memeTemplate === 'client_call' && '📞'}
                </span>
                {memeBottom && <p className="meme-caption text-white text-base font-black text-center uppercase w-full">{memeBottom}</p>}
              </div>
            </div>
          )}

          {/* Footer: anon toggle + submit */}
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-300 transition-colors">
              <div
                className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${isAnonymous ? 'bg-purple-600' : 'bg-navy-600'}`}
                onClick={() => setIsAnonymous((a) => !a)}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isAnonymous ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span>🤫 Post anonymously</span>
            </label>

            <div className="flex gap-2">
              <button type="button" onClick={resetForm} className="btn-ghost text-sm">Cancel</button>
              <button
                type="submit"
                disabled={loading || (type !== 'image' && type !== 'meme' && !text.trim())}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {loading ? 'Posting...' : isAnonymous ? '🤫 Post Anonymously' : '🍺 Post'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}
