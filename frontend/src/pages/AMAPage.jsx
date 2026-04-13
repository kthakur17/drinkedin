/**
 * AMAPage — Ask Me Anything session with questions, upvotes, and answers
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function AMAPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ama, setAma] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [closingAma, setClosingAma] = useState(false);
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [upvotingId, setUpvotingId] = useState(null);

  useEffect(() => {
    fetchAma();
  }, [id]);

  const fetchAma = async () => {
    try {
      const res = await api.get(`/ama/${id}`);
      setAma(res.data.ama || res.data);
      const q = res.data.questions || res.data.ama?.questions || [];
      // Sort by upvotes descending
      setQuestions([...q].sort((a, b) => (b.upvotes?.length || b.upvoteCount || 0) - (a.upvotes?.length || a.upvoteCount || 0)));
    } catch (err) {
      setError('AMA not found. The host probably ghosted.');
    }
    setLoading(false);
  };

  const isHost = ama?.host?._id === user?._id || ama?.host === user?._id;

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || submittingQuestion) return;
    setSubmittingQuestion(true);
    try {
      const res = await api.post(`/ama/${id}/questions`, {
        content: newQuestion.trim(),
        anonymous: true,
      });
      const question = res.data.question;
      setQuestions((prev) => [question, ...prev]);
      setNewQuestion('');
    } catch (_) {}
    setSubmittingQuestion(false);
  };

  const handleUpvote = async (questionId) => {
    if (upvotingId) return;
    setUpvotingId(questionId);
    try {
      const res = await api.post(`/ama/${id}/questions/${questionId}/upvote`);
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === questionId
            ? { ...q, upvotes: res.data.upvotes, upvoteCount: res.data.upvoteCount, hasUpvoted: res.data.hasUpvoted }
            : q
        ).sort((a, b) => (b.upvotes?.length || b.upvoteCount || 0) - (a.upvotes?.length || a.upvoteCount || 0))
      );
    } catch (_) {}
    setUpvotingId(null);
  };

  const handleStartAnswer = (questionId) => {
    setAnsweringId(answeringId === questionId ? null : questionId);
    setAnswerText('');
  };

  const handleSubmitAnswer = async (questionId) => {
    if (!answerText.trim() || submittingAnswer) return;
    setSubmittingAnswer(true);
    try {
      const res = await api.post(`/ama/${id}/questions/${questionId}/answer`, {
        content: answerText.trim(),
      });
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === questionId
            ? { ...q, answer: res.data.answer || answerText.trim(), answeredAt: new Date().toISOString() }
            : q
        )
      );
      setAnsweringId(null);
      setAnswerText('');
    } catch (_) {}
    setSubmittingAnswer(false);
  };

  const handleCloseAma = async () => {
    if (!window.confirm('Close this AMA? No more questions will be accepted.')) return;
    setClosingAma(true);
    try {
      const res = await api.post(`/ama/${id}/close`);
      setAma((prev) => ({ ...prev, status: 'closed' }));
    } catch (_) {}
    setClosingAma(false);
  };

  const hasUpvoted = (question) => {
    if (question.hasUpvoted !== undefined) return question.hasUpvoted;
    if (question.upvotes && Array.isArray(question.upvotes)) {
      return question.upvotes.includes(user?._id);
    }
    return false;
  };

  const getUpvoteCount = (question) => {
    return question.upvoteCount || question.upvotes?.length || 0;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card p-5">
          <div className="skeleton h-7 w-56 rounded mb-3" />
          <div className="flex gap-3 mb-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-2 w-20 rounded" />
            </div>
          </div>
          <div className="skeleton h-3 w-full rounded mb-2" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-3 w-full rounded mb-2" />
            <div className="skeleton h-3 w-2/3 rounded mb-3" />
            <div className="skeleton h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center animate-fade-in">
        <p className="text-5xl mb-4 animate-float">🎤</p>
        <p className="text-red-400 font-display text-lg">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm mt-4">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* AMA Header */}
      <div className="card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-navy-800 to-purple-900/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative">
          {/* Top row: back + close */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 text-xs hover:text-gold-400 transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span className={`badge-pill text-xs ${
                ama.status === 'active' || ama.status === 'live'
                  ? 'bg-green-900/30 text-green-400 border-green-700'
                  : 'bg-gray-800 text-gray-500 border-gray-700'
              }`}>
                {ama.status === 'active' || ama.status === 'live' ? '🟢 Live' : '🔴 Closed'}
              </span>
              {isHost && ama.status !== 'closed' && (
                <button
                  onClick={handleCloseAma}
                  disabled={closingAma}
                  className="btn-danger text-xs py-1.5 px-3"
                >
                  {closingAma ? 'Closing...' : 'Close AMA'}
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl text-white mb-4 flex items-center gap-2">
            <span>🎤</span> {ama.title}
          </h1>

          {/* Host Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-navy-600 flex items-center justify-center text-lg overflow-hidden ring-2 ring-purple-700/30">
              {ama.host?.avatar ? (
                <img src={ama.host.avatar} className="w-full h-full object-cover" alt="" />
              ) : '👤'}
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {ama.host?.alias || ama.host?.username || 'Unknown Host'}
              </p>
              <p className="text-gray-500 text-xs">
                Host
                {ama.createdAt && (
                  <> &middot; Started {formatDistanceToNow(new Date(ama.createdAt), { addSuffix: true })}</>
                )}
              </p>
            </div>
          </div>

          {/* Description */}
          {ama.description && (
            <p className="text-gray-300 text-sm leading-relaxed">{ama.description}</p>
          )}
        </div>
      </div>

      {/* Question Submission */}
      {ama.status !== 'closed' && (
        <div className="card p-5">
          <form onSubmit={handleSubmitQuestion}>
            <textarea
              className="textarea text-sm w-full"
              rows={3}
              placeholder="Ask something... anonymously, of course."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={submittingQuestion}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-gray-600 text-xs flex items-center gap-1">
                🤫 All questions are anonymous
              </span>
              <button
                type="submit"
                disabled={!newQuestion.trim() || submittingQuestion}
                className="btn-primary text-sm"
              >
                {submittingQuestion ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-navy-800/30 border-t-navy-800 rounded-full animate-spin" />
                    Asking...
                  </span>
                ) : 'Ask Anonymously'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div>
        <h2 className="font-display text-lg text-white mb-3 px-1 flex items-center gap-2">
          <span>❓</span> Questions
          <span className="text-gray-500 font-body text-sm">({questions.length})</span>
        </h2>

        {questions.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl mb-2 animate-float">🤔</p>
            <p className="text-gray-400 text-sm">No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 stagger-list">
            {questions.map((question) => (
              <div key={question._id} className="card p-5">
                {/* Question Text */}
                <p className="text-gray-200 text-sm leading-relaxed mb-3">
                  {question.content || question.text}
                </p>

                {/* Upvote & Meta */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => handleUpvote(question._id)}
                    disabled={upvotingId === question._id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all border
                      ${hasUpvoted(question)
                        ? 'bg-gold-900/30 border-gold-700 text-gold-400'
                        : 'bg-navy-700 border-navy-600 text-gray-400 hover:border-gold-800 hover:text-gold-400'
                      }`}
                  >
                    <span>🍺</span>
                    <span className="font-semibold">{getUpvoteCount(question)}</span>
                  </button>
                  {question.createdAt && (
                    <span className="text-gray-600 text-xs">
                      {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>

                {/* Answer (if exists) */}
                {question.answer && (
                  <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-4 mt-2">
                    <p className="text-green-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span>✅</span> Answer from host
                    </p>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {typeof question.answer === 'string' ? question.answer : question.answer.content}
                    </p>
                  </div>
                )}

                {/* Answer button (host only, unanswered) */}
                {isHost && !question.answer && (
                  <div className="mt-3">
                    {answeringId === question._id ? (
                      <div className="animate-slide-up">
                        <textarea
                          className="textarea text-sm w-full"
                          rows={3}
                          placeholder="Type your answer..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSubmitAnswer(question._id)}
                            disabled={!answerText.trim() || submittingAnswer}
                            className="btn-primary text-xs"
                          >
                            {submittingAnswer ? 'Posting...' : 'Post Answer'}
                          </button>
                          <button
                            onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                            className="btn-ghost text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartAnswer(question._id)}
                        className="btn-secondary text-xs"
                      >
                        ✍️ Answer
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
