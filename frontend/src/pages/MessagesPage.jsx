/**
 * MessagesPage — two-panel messaging with real-time chat
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';

export default function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Socket for real-time messages
  const activeConvoRef = useRef(null);
  activeConvoRef.current = activeConvo;

  const { emit } = useSocket(
    // onNotification — handle notification events (e.g. for badges, toasts)
    null,
    // onNewMessage — handle real-time messages from conversation room
    (message) => {
      const currentConvo = activeConvoRef.current;
      // Only add to messages if it's for the active conversation and not sent by us
      if (message.conversation === currentConvo?._id && message.sender?._id !== user?._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) =>
          c._id === message.conversation
            ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() }
            : c
        )
      );
    }
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  // Fetch conversation list
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await api.get('/messages/conversations');
        setConversations(res.data.conversations || []);
      } catch (_) {}
      setLoadingConvos(false);
    };
    loadConversations();
  }, []);

  // Load conversation from URL param
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      setMobileShowChat(true);
    }
  }, [conversationId]);

  const loadConversation = async (id) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/conversations/${id}`);
      setActiveConvo(res.data.conversation);
      setMessages(res.data.messages || []);
      emit('join_conversation', id);
      scrollToBottom();
    } catch (_) {}
    setLoadingMessages(false);
  };

  const selectConversation = (convo) => {
    navigate(`/messages/${convo._id}`);
    setMobileShowChat(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvo || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/conversations/${activeConvo._id}`, {
        text: messageText.trim(),
      });
      setMessages((prev) => [...prev, res.data.message]);
      setMessageText('');
      scrollToBottom();
      // Update preview in list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConvo._id
            ? { ...c, lastMessage: res.data.message, updatedAt: new Date().toISOString() }
            : c
        )
      );
    } catch (_) {}
    setSending(false);
  };

  // User search for new conversation
  const handleUserSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeoutRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(res.data.users || []);
      } catch (_) {
        setSearchResults([]);
      }
      setSearchingUsers(false);
    }, 300);
  };

  const startConversation = async (targetUser) => {
    try {
      const res = await api.post('/messages/conversations', {
        recipientId: targetUser._id,
      });
      const convo = res.data.conversation;
      setConversations((prev) => {
        if (prev.some((c) => c._id === convo._id)) return prev;
        return [convo, ...prev];
      });
      setShowNewConvo(false);
      setSearchQuery('');
      setSearchResults([]);
      navigate(`/messages/${convo._id}`);
      setMobileShowChat(true);
    } catch (_) {}
  };

  const getOtherParticipant = (convo) => {
    if (!convo?.participants) return null;
    return convo.participants.find((p) => p._id !== user?._id) || convo.participants[0];
  };

  return (
    <div className="animate-fade-in">
      <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
        <div className="flex h-full">
          {/* Left Panel — Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-navy-700 flex flex-col flex-shrink-0
              ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}
          >
            {/* Header */}
            <div className="p-4 border-b border-navy-700 flex items-center justify-between flex-shrink-0">
              <h1 className="font-display text-lg text-white flex items-center gap-2">
                <span>💬</span> Messages
              </h1>
              <button
                onClick={() => setShowNewConvo(!showNewConvo)}
                className="btn-primary text-xs py-1.5 px-3"
              >
                + New
              </button>
            </div>

            {/* New Conversation Search */}
            {showNewConvo && (
              <div className="p-3 border-b border-navy-700 bg-navy-800/50 animate-slide-up">
                <input
                  className="input text-sm w-full"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  autoFocus
                />
                {searchingUsers && (
                  <p className="text-gray-500 text-xs mt-2 px-1">Searching...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {searchResults.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => startConversation(u)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-navy-700 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                          {u.avatar ? (
                            <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                          ) : '👤'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{u.alias || u.username}</p>
                          <p className="text-gray-500 text-xs truncate">@{u.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvos ? (
                <div className="space-y-1 p-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-3 p-3">
                      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 w-28 rounded" />
                        <div className="skeleton h-2 w-40 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-2 animate-float">💬</p>
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                  <p className="text-gray-600 text-xs mt-1">Start one above!</p>
                </div>
              ) : (
                <div className="space-y-0.5 p-1">
                  {conversations.map((convo) => {
                    const other = getOtherParticipant(convo);
                    const isActive = activeConvo?._id === convo._id;
                    return (
                      <button
                        key={convo._id}
                        onClick={() => selectConversation(convo)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
                          ${isActive
                            ? 'bg-gold-900/20 border border-gold-800/30'
                            : 'hover:bg-navy-700/50 border border-transparent'
                          }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-navy-600 flex items-center justify-center text-lg overflow-hidden flex-shrink-0 ring-1 ring-navy-500">
                          {other?.avatar ? (
                            <img src={other.avatar} className="w-full h-full object-cover" alt="" />
                          ) : '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-white text-sm font-medium truncate">
                              {other?.alias || other?.username || 'Unknown'}
                            </p>
                            {convo.updatedAt && (
                              <span className="text-gray-600 text-xs flex-shrink-0">
                                {formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: false })}
                              </span>
                            )}
                          </div>
                          {convo.lastMessage && (
                            <p className="text-gray-500 text-xs truncate mt-0.5">
                              {convo.lastMessage.sender === user?._id ? 'You: ' : ''}
                              {convo.lastMessage.text}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel — Active Chat */}
          <div
            className={`flex-1 flex flex-col min-w-0
              ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}
          >
            {activeConvo ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-navy-700 flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => { setMobileShowChat(false); navigate('/messages'); }}
                    className="md:hidden text-gray-400 hover:text-gold-400 transition-colors mr-1"
                  >
                    ←
                  </button>
                  <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center text-sm overflow-hidden ring-1 ring-navy-500">
                    {getOtherParticipant(activeConvo)?.avatar ? (
                      <img
                        src={getOtherParticipant(activeConvo).avatar}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : '👤'}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {getOtherParticipant(activeConvo)?.alias ||
                       getOtherParticipant(activeConvo)?.username || 'Unknown'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      @{getOtherParticipant(activeConvo)?.username}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                          <div className="skeleton h-10 w-48 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-3xl mb-2">🍻</p>
                        <p className="text-gray-500 text-sm">No messages yet. Break the ice!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isOwn = msg.sender === user?._id || msg.sender?._id === user?._id;
                      return (
                        <div
                          key={msg._id || idx}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                              ${isOwn
                                ? 'bg-gold-900/40 border border-gold-800/30 text-gold-100 rounded-br-md'
                                : 'bg-navy-700 border border-navy-600 text-gray-200 rounded-bl-md'
                              }`}
                          >
                            <p>{msg.text}</p>
                            {msg.createdAt && (
                              <p className={`text-xs mt-1 ${isOwn ? 'text-gold-600/60' : 'text-gray-600'}`}>
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-navy-700 flex items-center gap-2 flex-shrink-0">
                  <input
                    className="flex-1 min-w-0 bg-navy-800 border border-navy-600 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold-600 focus:ring-2 focus:ring-gold-600/20 transition-all duration-200"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending}
                    className="btn-primary px-4 py-2.5 text-sm flex-shrink-0"
                  >
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-navy-800/30 border-t-navy-800 rounded-full animate-spin inline-block" />
                    ) : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                  <p className="text-5xl mb-4 animate-float">💬</p>
                  <p className="text-gradient-gold font-display text-xl mb-2">Select a conversation</p>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Pick a chat or start a new one. Gossip responsibly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
