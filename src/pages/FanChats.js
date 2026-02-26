import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import FanNav from '../components/FanNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './FanChats.css';

function formatChatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = d.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  if (dateStr === today) return timeStr;
  if (dateStr === yesterday.toDateString()) return `Yesterday ${timeStr}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
}

function FanChats() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
      return;
    }

    const fetchChannels = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await chatAPI.getIndividualChannels();
        if (res.StatusCode === 200 && res.data?.channels) {
          setChannels(res.data.channels);
        } else {
          setChannels([]);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load chats');
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, [navigate]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await chatAPI.getIndividualChannels();
      if (res.StatusCode === 200 && res.data?.channels) {
        setChannels(res.data.channels);
      } else {
        setChannels([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load chats');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="fan-chats-page">
      <FanNav active="chats" userName={user.userName} onLogout={handleLogout} />
      <main className="fan-chats-main">
        <div className="fan-chats-container">
          <h1 className="fan-chats-title">Chats</h1>

          {error ? (
            <ErrorWidget errorText={error} onRetry={refetch} />
          ) : loading ? (
            <LoadingSpinner />
          ) : channels.length === 0 ? (
            <EmptyWidget text="You have no chats" />
          ) : (
            <ul className="fan-chats-list">
              {channels.map((ch) => (
                <li key={ch.id}>
                  <Link to={`/fan/chats/${ch.id}`} className="fan-chats-row">
                    <div className="fan-chats-avatar-wrap">
                      <div className="fan-chats-avatar-placeholder">
                        <PersonIcon />
                      </div>
                    </div>
                    <div className="fan-chats-content">
                      <div className="fan-chats-row-top">
                        <span className="fan-chats-name">
                          {ch.otherMemberDisplayName || 'User'}
                        </span>
                        <span className="fan-chats-time">
                          {formatChatTime(ch.lastMessageAt || ch.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <div className="fan-chats-row-bottom">
                        <span className="fan-chats-preview">
                          {ch.lastMessage?.text || 'No messages yet'}
                        </span>
                        {ch.unreadCount > 0 && (
                          <span className="fan-chats-unread">{ch.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default FanChats;
