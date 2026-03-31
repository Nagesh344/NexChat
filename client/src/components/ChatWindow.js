import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import styles from './ChatWindow.module.css';

export default function ChatWindow({ room }) {
  const { user } = useAuth();
  const { messages, loading, hasMore, loadMore, sendMessage, sendTyping, typingUsers } = useMessages(room);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const typingTimer = useRef(null);
  const isTyping = useRef(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Infinite scroll (load more on top)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    const el = topRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading, loadMore]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput('');
    stopTyping();
    sendMessage(content);
    setSending(false);
  }, [input, sending, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const stopTyping = useCallback(() => {
    if (isTyping.current) {
      isTyping.current = false;
      sendTyping(user?.username, false);
    }
    clearTimeout(typingTimer.current);
  }, [sendTyping, user]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isTyping.current) {
      isTyping.current = true;
      sendTyping(user?.username, true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2500);
  };

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || '??';

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
  };

  // Group messages by date and collapse consecutive same-sender messages
  const groupedMessages = [];
  let lastDate = null;
  let lastSenderId = null;

  messages.forEach((msg, i) => {
    const msgDate = formatDate(msg.createdAt);
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', label: msgDate, key: `date-${i}` });
      lastDate = msgDate;
      lastSenderId = null;
    }
    const isConsecutive = lastSenderId === (msg.sender?._id || msg.sender);
    groupedMessages.push({ type: 'message', msg, isConsecutive, key: msg._id });
    lastSenderId = msg.sender?._id || msg.sender;
  });

  if (!room) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>⬡</div>
        <h2>Select a channel</h2>
        <p>Choose a room from the sidebar to start chatting</p>
      </div>
    );
  }

  return (
    <div className={styles.window}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.roomInfo}>
          <span className={styles.roomHash}>#</span>
          <span className={styles.roomName}>{room}</span>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.metaText}>Real-time • WebSocket</span>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        <div ref={topRef} className={styles.loadMore}>
          {loading && <div className={styles.loadingDots}><span/><span/><span/></div>}
          {!hasMore && messages.length > 0 && (
            <p className={styles.beginning}>⬡ Beginning of #{room}</p>
          )}
        </div>

        {groupedMessages.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.key} className={styles.dateDivider}>
                <span>{item.label}</span>
              </div>
            );
          }

          const { msg, isConsecutive } = item;
          const isOwn = (msg.sender?._id || msg.sender) === user?._id;

          return (
            <div
              key={item.key}
              className={`${styles.message} ${isOwn ? styles.own : ''} ${isConsecutive ? styles.consecutive : ''} fade-in`}
            >
              {!isConsecutive && (
                <div className={`${styles.avatar} ${isOwn ? styles.ownAvatar : ''}`}>
                  {getInitials(msg.sender?.username)}
                </div>
              )}
              {isConsecutive && <div className={styles.avatarPlaceholder} />}

              <div className={styles.messageBody}>
                {!isConsecutive && (
                  <div className={styles.messageMeta}>
                    <span className={`${styles.senderName} ${isOwn ? styles.ownName : ''}`}>
                      {isOwn ? 'You' : msg.sender?.username}
                    </span>
                    <span className={styles.time}>{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                <div className={`${styles.bubble} ${isOwn ? styles.ownBubble : ''}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className={styles.typing}>
            <div className={styles.typingDots}><span/><span/><span/></div>
            <span>
              {typingUsers.map(u => u.username).join(', ')}
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <form onSubmit={handleSend} className={styles.inputForm}>
          <textarea
            className={styles.input}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${room}`}
            rows={1}
            maxLength={2000}
          />
          <button type="submit" className={styles.sendBtn} disabled={!input.trim() || sending}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
        <div className={styles.inputHint}>
          <span>Enter to send · Shift+Enter for newline</span>
          <span className={`${styles.charCount} ${input.length > 1800 ? styles.charWarn : ''}`}>
            {input.length}/2000
          </span>
        </div>
      </div>
    </div>
  );
}
