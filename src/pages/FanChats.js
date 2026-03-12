import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatAPI } from '../services/api';
import { getCached, setCached, clearCached } from '../utils/routeDataCache';
import { DEFAULT_AVATAR_URL } from '../constants';
import { useChat } from '../context/ChatContext';
import FanNav from '../components/FanNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
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

const PHOTO_PLACEHOLDER_KEYS = ['photo', 'foto', 'image', 'bild'];

function FanChats({ embedded, user: userProp, onLogout: onLogoutProp }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { client, connect, disconnect, connecting } = useChat();
  const [userState, setUserState] = useState(null);
  const user = embedded ? userProp : userState;
  const handleLogout = embedded ? onLogoutProp : () => {
    disconnect?.();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };
  const [channels, setChannels] = useState([]);
  const [memberInfoMap, setMemberInfoMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [namesLoading, setNamesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const hasEnrichedNamesOnce = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      setUserState(JSON.parse(userJson));
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
          setCached('channels', res.data.channels);
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

    const cached = getCached('channels');
    if (Array.isArray(cached)) {
      setChannels(cached);
      setLoading(false);
      setError(null);
      const memberCached = getCached('fanChatMemberInfo');
      if (memberCached && typeof memberCached === 'object' && !Array.isArray(memberCached)) {
        setMemberInfoMap(memberCached);
        hasEnrichedNamesOnce.current = true;
      }
      // Refresh channel list in background so new messages / new chats show without full reload
      const refreshInBackground = async () => {
        try {
          const res = await chatAPI.getIndividualChannels();
          if (res.StatusCode === 200 && res.data?.channels) {
            setCached('channels', res.data.channels);
            setChannels(res.data.channels);
          }
        } catch {
          // keep existing list on error
        }
      };
      refreshInBackground();
      return;
    }

    fetchChannels();
  }, [navigate]);

  // Connect Stream client when on this page so we can fetch member names/avatars
  useEffect(() => {
    if (!client && !connecting) connect();
  }, [client, connecting, connect]);

  // Enrich channel list with usernames and avatars from Stream (same source as conversation header).
  // Only run when client is ready so we don't show "User" for every row due to race (channels from cache, client not connected yet).
  // Only show names-loading spinner on initial enrich; after delete we update local state and don't re-show loader.
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
    const isInitialEnrich = !hasEnrichedNamesOnce.current;
    if (isInitialEnrich) setNamesLoading(true);
    client
      .queryUsers({ id: { $in: otherIds } })
      .then((res) => {
        const map = {};
        (res.users || []).forEach((u) => {
          map[u.id] = { name: u.name || 'User', image: u.image || null };
        });
        setMemberInfoMap(map);
        setCached('fanChatMemberInfo', map);
        hasEnrichedNamesOnce.current = true;
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
    clearCached('fanChatMemberInfo');
    hasEnrichedNamesOnce.current = false;
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

  // Close inline delete menu when clicking anywhere else
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!menuOpenFor) return;
      const target = e.target;
      if (
        target.closest('.fan-chats-menu') ||
        target.closest('.fan-chats-menu-toggle')
      ) {
        return;
      }
      setMenuOpenFor(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [menuOpenFor]);

  const handleOpenMenu = (e, channelId) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpenFor((prev) => (prev === channelId ? null : channelId));
  };

  const handleRequestDeleteChat = (channelId) => {
    setChannelToDelete(channelId);
    setMenuOpenFor(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteChatConfirm = async () => {
    if (!channelToDelete) return;
    setDeletingId(channelToDelete);
    try {
      await chatAPI.deleteIndividualChannel(channelToDelete);
      setChannels((prev) => {
        const next = prev.filter((ch) => ch.id !== channelToDelete);
        setCached('channels', next);
        return next;
      });
    } catch (err) {
      // keep list unchanged on error; optional: surface error widget
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    }
  };
  if (!user) return null;

  // Show full-page loader when: fetching channels, waiting for client, or loading names with nothing to show yet.
  // On refresh (no cache) we have channels + client but empty memberInfoMap → show loader until names load.
  // When coming back from conversation we restore memberInfoMap from cache → show list immediately.
  const waitingForNames = channels.length > 0 && !client;
  const loadingNamesWithNoDisplay = channels.length > 0 && namesLoading && Object.keys(memberInfoMap).length === 0;
  const showLoading = loading || waitingForNames || loadingNamesWithNoDisplay;

  return (
    <div className="fan-chats-page">
      {!embedded && <FanNav active="chats" user={user} onLogout={handleLogout} />}
      <main className="fan-chats-main">
        <div className="fan-chats-container">
          <h1 className="fan-chats-title">Chats</h1>

          {error ? (
            <ErrorWidget errorText={error} onRetry={refetch} />
          ) : showLoading ? (
            <LoadingSpinner />
          ) : channels.length === 0 ? (
            <EmptyWidget text="You have no chats" />
          ) : (
            <ul className="fan-chats-list">
              {channels.map((ch) => {
                const displayName = (memberInfoMap[ch.otherMemberId]?.name || ch.otherMemberDisplayName) || 'User';
                const avatarUrl = memberInfoMap[ch.otherMemberId]?.image || ch.otherMemberAvatarUrl;
                const isMenuOpen = menuOpenFor === ch.id;
                const isDeleting = deletingId === ch.id;
                return (
                <li key={ch.id}>
                  <Link
                    to={`/fan/chats/${ch.id}`}
                    className="fan-chats-row"
                    onContextMenu={(e) => handleOpenMenu(e, ch.id)}
                  >
                    <div className="fan-chats-avatar-wrap">
                      <img
                        src={avatarUrl || DEFAULT_AVATAR_URL}
                        alt=""
                        className="fan-chats-avatar-img"
                      />
                    </div>
                    <div className="fan-chats-content">
                      <span className="fan-chats-name">
                        {displayName}
                      </span>
                      <span className="fan-chats-preview">
                        {(() => {
                          if (!ch.lastMessage) return t('chats.noMessagesYet');
                          const text = ch.lastMessage?.text?.trim();
                          if (!text || PHOTO_PLACEHOLDER_KEYS.includes(text.toLowerCase())) return t('chats.photo');
                          return text;
                        })()}
                      </span>
                    </div>
                    <div className="fan-chats-right">
                      <span className="fan-chats-time">
                        {formatChatTime(ch.lastMessageAt || ch.lastMessage?.createdAt)}
                      </span>
                      {ch.unreadCount > 0 && (
                        <span className="fan-chats-unread">{ch.unreadCount}</span>
                      )}
                      <button
                        type="button"
                        className="fan-chats-menu-toggle"
                        aria-label={t('chats.deleteChat')}
                        onClick={(e) => handleOpenMenu(e, ch.id)}
                      >
                        <span className="fan-chats-menu-chevron" />
                      </button>
                    </div>
                  </Link>
                  {isMenuOpen && (
                    <div className="fan-chats-menu">
                      <button
                        type="button"
                        className="fan-chats-menu-item fan-chats-menu-item--danger"
                        onClick={() => handleRequestDeleteChat(ch.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? t('common.deleting') || 'Deleting…' : t('chats.deleteChat')}
                      </button>
                    </div>
                  )}
                </li>
              );
              })}
            </ul>
          )}
        </div>
      </main>
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setChannelToDelete(null);
        }}
        onConfirm={handleDeleteChatConfirm}
        deleting={!!deletingId}
        title={t('deleteAccount.title')}
        message={t('deleteAccount.message')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('chats.deleteChat')}
        deletingLabel={t('deleteAccount.deleting')}
      />
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
