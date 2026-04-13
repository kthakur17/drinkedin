/**
 * CreateStoryModal — modal for creating a 24h disappearing story
 * Supports text stories (with background color picker) and photo stories.
 */

import { useState, useRef } from 'react';
import api from '../../utils/api';

const BG_COLORS = [
  { id: 'navy',   hex: '#1e2d6b', label: 'Navy' },
  { id: 'purple', hex: '#7c3aed', label: 'Purple' },
  { id: 'red',    hex: '#dc2626', label: 'Red' },
  { id: 'green',  hex: '#059669', label: 'Green' },
  { id: 'gold',   hex: '#d97706', label: 'Gold' },
  { id: 'blue',   hex: '#1d4ed8', label: 'Blue' },
];

const MODES = [
  { id: 'text',  label: 'Text',  emoji: '✍️' },
  { id: 'photo', label: 'Photo', emoji: '📷' },
];

export default function CreateStoryModal({ onClose, onCreated }) {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0].hex);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const fileRef = useRef(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 200);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const canSubmit = () => {
    if (loading) return false;
    if (mode === 'text') return text.trim().length > 0;
    if (mode === 'photo') return imageFile !== null;
    return false;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setLoading(true);
    setError('');

    try {
      if (mode === 'text') {
        await api.post('/stories', {
          type: 'text',
          text: text.trim(),
          backgroundColor: bgColor,
        });
      } else {
        // Photo mode — upload as FormData
        const formData = new FormData();
        formData.append('type', 'image');
        formData.append('image', imageFile);
        if (caption.trim()) {
          formData.append('text', caption.trim());
        }
        await api.post('/stories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'rgba(5, 7, 15, 0.9)' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md mx-4 bg-navy-800 border border-navy-600 rounded-2xl shadow-2xl overflow-hidden transition-transform duration-200 ${
          isClosing ? 'scale-95' : 'scale-100 animate-scale-in'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-white font-semibold text-lg">Create Story</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-navy-700 hover:bg-navy-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 px-5 mb-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === m.id
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 shadow-lg shadow-gold-500/20'
                  : 'bg-navy-700 text-gray-400 hover:text-white border border-navy-600 hover:border-navy-500'
              }`}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5">
          {/* ═══ TEXT MODE ═══ */}
          {mode === 'text' && (
            <div className="space-y-4 animate-fade-in">
              {/* Live preview */}
              <div
                className="rounded-xl overflow-hidden transition-colors duration-300 relative"
                style={{
                  backgroundColor: bgColor,
                  minHeight: '200px',
                }}
              >
                <div className="flex items-center justify-center p-6 min-h-[200px]">
                  {text.trim() ? (
                    <p className="text-white text-lg font-semibold text-center leading-relaxed drop-shadow-lg break-words max-w-full">
                      {text}
                    </p>
                  ) : (
                    <p className="text-white/30 text-base italic text-center">
                      Your story preview
                    </p>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <span className="text-white/30 text-[10px] font-mono bg-black/20 rounded px-1.5 py-0.5">
                    Preview
                  </span>
                </div>
              </div>

              {/* Text input */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share a quick thought..."
                className="textarea text-sm"
                rows={3}
                maxLength={300}
                autoFocus
              />
              <div className="flex justify-end">
                <span className="text-gray-600 text-xs tabular-nums">
                  {text.length}/300
                </span>
              </div>

              {/* Color picker */}
              <div>
                <p className="text-gray-400 text-xs mb-2 font-medium">Background</p>
                <div className="flex gap-2.5">
                  {BG_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setBgColor(color.hex)}
                      className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${
                        bgColor === color.hex
                          ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-navy-800 scale-110'
                          : 'hover:scale-110 ring-1 ring-white/10'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    >
                      {bgColor === color.hex && (
                        <svg className="w-3.5 h-3.5 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ PHOTO MODE ═══ */}
          {mode === 'photo' && (
            <div className="space-y-4 animate-fade-in">
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden bg-navy-900">
                  <img
                    src={imagePreview}
                    alt="Story preview"
                    className="w-full max-h-72 object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-navy-900/80 hover:bg-red-900/80 text-white flex items-center justify-center text-sm transition-colors"
                    title="Remove image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-navy-600 hover:border-gold-600 rounded-xl py-12 text-center text-gray-500 hover:text-gray-300 transition-all duration-300 group bg-navy-900/30 hover:bg-navy-900/50"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    📷
                  </div>
                  <p className="text-sm font-medium">Click to upload a photo</p>
                  <p className="text-xs text-gray-600 mt-1">JPG, PNG, GIF up to 10MB</p>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Optional caption */}
              {imagePreview && (
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="input text-sm"
                  maxLength={200}
                />
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm mt-3 animate-fade-in">{error}</p>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-navy-700">
            <p className="text-gray-600 text-xs flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Disappears in 24h
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Posting...
                  </span>
                ) : (
                  '🍻 Share Story'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
