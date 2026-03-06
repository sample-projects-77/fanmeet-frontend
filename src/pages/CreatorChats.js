import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import { useChat } from '../context/ChatContext';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorChats.css';

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

function CreatorChats() {
  const navigate = useNavigate();
  const { client, connect, disconnect, connecting } = useChat();
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [memberInfoMap, setMemberInfoMap] = useState({});
  const [loading, setLoading] = useState(true);
   const [namesLoading, setNamesLoading] = useState(false);
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

  // Connect Stream client when on this page so we can fetch member names/avatars
  useEffect(() => {
    if (!client && !connecting) connect();
  }, [client, connecting, connect]);

  // Enrich channel list with usernames and avatars from Stream (same source as conversation header)
  useEffect(() => {
    if (!client || channels.length === 0) {
      setNamesLoading(false);
      return;
    }
    const otherIds = [...new Set(channels.map((ch) => ch.otherMemberId).filter(Boolean))];
    if (otherIds.length === 0) {
      setNamesLoading(false);
      return;
    }
    setNamesLoading(true);
    client
      .queryUsers({ id: { $in: otherIds } })
      .then((res) => {
        const map = {};
        (res.users || []).forEach((u) => {
          map[u.id] = { name: u.name || 'User', image: u.image || null };
        });
        setMemberInfoMap(map);
      })
      .catch(() => {})
      .finally(() => {
        setNamesLoading(false);
      });
  }, [client, channels]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMemberInfoMap({});
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
    disconnect?.();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const showLoading = loading || namesLoading;

  return (
    <div className="creator-chats-page">
      <CreatorNav active="chats" user={user} onLogout={handleLogout} />
      <main className="creator-chats-main">
        <div className="creator-chats-container">
          <h1 className="creator-chats-title">Chats</h1>

          {error ? (
            <ErrorWidget errorText={error} onRetry={refetch} />
          ) : showLoading ? (
            <LoadingSpinner />
          ) : channels.length === 0 ? (
            <EmptyWidget text="You have no chats" />
          ) : (
            <ul className="creator-chats-list">
              {channels.map((ch) => {
                const displayName = (memberInfoMap[ch.otherMemberId]?.name || ch.otherMemberDisplayName) || 'User';
                const avatarUrl = memberInfoMap[ch.otherMemberId]?.image || ch.otherMemberAvatarUrl;
                return (
                <li key={ch.id}>
                  <Link to={`/creator/chats/${ch.id}`} className="creator-chats-row">
                    <div className="creator-chats-avatar-wrap">
                      <img
                        src={avatarUrl || DEFAULT_AVATAR_URL}
                        alt=""
                        className="creator-chats-avatar-img"
                      />
                    </div>
                    <div className="creator-chats-content">
                      <span className="creator-chats-name">
                        {displayName}
                      </span>
                      <span className="creator-chats-preview">
                        {ch.lastMessage?.text || 'No messages yet'}
                      </span>
                    </div>
                    <div className="creator-chats-right">
                      <span className="creator-chats-time">
                        {formatChatTime(ch.lastMessageAt || ch.lastMessage?.createdAt)}
                      </span>
                      {ch.unreadCount > 0 && (
                        <span className="creator-chats-unread">{ch.unreadCount}</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
              })}
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

export default CreatorChats;
