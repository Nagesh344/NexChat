import { useState, useEffect, useCallback, useRef } from 'react';
import { useWS } from '../context/WSContext';
import api from '../utils/api';

export const useMessages = (room) => {
  const { on, send } = useWS();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimers = useRef({});

  // Fetch paginated messages
  const fetchMessages = useCallback(async (pageNum = 1, replace = true) => {
    if (!room) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${room}?page=${pageNum}&limit=50`);
      setMessages((prev) => replace ? data.messages : [...data.messages, ...prev]);
      setHasMore(pageNum < data.pagination.pages);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [room]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchMessages(page + 1, false);
  }, [loading, hasMore, page, fetchMessages]);

  // Join room & listen for WS events
  useEffect(() => {
    if (!room) return;
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setTypingUsers([]);

    fetchMessages(1, true);
    send({ type: 'join_room', room });

    const offNew = on('new_message', (msg) => {
      if (msg.message.room === room) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg.message._id)) return prev;
          return [...prev, msg.message];
        });
      }
    });

    const offTypingStart = on('typing_start', (msg) => {
      if (msg.userId !== undefined) {
        setTypingUsers((prev) => {
          if (prev.find((u) => u.userId === msg.userId)) return prev;
          return [...prev, { userId: msg.userId, username: msg.username }];
        });
        // Auto-clear after 4s
        clearTimeout(typingTimers.current[msg.userId]);
        typingTimers.current[msg.userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== msg.userId));
        }, 4000);
      }
    });

    const offTypingStop = on('typing_stop', (msg) => {
      clearTimeout(typingTimers.current[msg.userId]);
      setTypingUsers((prev) => prev.filter((u) => u.userId !== msg.userId));
    });

    return () => {
      offNew();
      offTypingStart();
      offTypingStop();
      send({ type: 'leave_room', room });
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [room, on, send, fetchMessages]);

  const sendMessage = useCallback((content) => {
    return send({ type: 'send_message', room, content });
  }, [room, send]);

  const sendTyping = useCallback((username, isTyping) => {
    send({ type: isTyping ? 'typing_start' : 'typing_stop', room, username });
  }, [room, send]);

  return { messages, loading, hasMore, loadMore, sendMessage, sendTyping, typingUsers };
};
