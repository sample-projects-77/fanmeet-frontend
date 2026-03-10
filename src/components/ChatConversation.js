import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Chat,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  MessageOptions as DefaultMessageOptions,
  useChatContext,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { useChat } from '../context/ChatContext';
import LoadingSpinner from './LoadingSpinner';
import './ChatConversation.css';

function ChatContent({ channelId, backTo, backLabel, NavComponent }) {
  const { client } = useChatContext();
  const [channel, setChannel] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!client || !channelId) return;
    const c = client.channel('messaging', channelId);
    setChannel(c);
    setLoadError(null);
  }, [client, channelId]);

  if (!channel) {
    if (loadError) {
      return (
        <div className="chat-conversation-error">
          <p>{loadError}</p>
          <Link to={backTo}>{backLabel}</Link>
        </div>
      );
    }
    return (
      <div className="chat-conversation-loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Channel
      channel={channel}
      MessageOptions={(props) => <DefaultMessageOptions {...props} displayReplies={false} />}
    >
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput additionalTextareaProps={{ placeholder: 'Type a message' }} />
      </Window>
    </Channel>
  );
}

const LONG_PRESS_MS = 500;

function ChatConversation({ backTo, backLabel, NavComponent }) {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { client, connecting, error, connect, disconnect, isReady } = useChat();
  const [user, setUser] = useState(null);
  const streamRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressMessageRef = useRef(null);

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
    }
  }, [navigate]);

  useEffect(() => {
    if (!client && !connecting) connect();
  }, [client, connecting, connect]);

  /* Desktop: show message options (three-dots) on hover via class (run when chat is ready so streamRef is mounted) */
  const hoveredRowRef = useRef(null);
  useEffect(() => {
    if (!isReady) return;
    const container = streamRef.current;
    if (!container) return;

    const HOVER_CLASS = 'chat-conversation-message-hovered';

    const onMouseOver = (e) => {
      if (!container.contains(e.target)) return;
      const row = e.target.closest?.('.str-chat__li') || e.target.closest?.('.str-chat__virtual-list-message-wrapper');
      if (row && row !== hoveredRowRef.current) {
        if (hoveredRowRef.current) hoveredRowRef.current.classList.remove(HOVER_CLASS);
        hoveredRowRef.current = row;
        row.classList.add(HOVER_CLASS);
      }
    };

    const onMouseOut = (e) => {
      if (!container.contains(e.relatedTarget)) {
        if (hoveredRowRef.current) {
          hoveredRowRef.current.classList.remove(HOVER_CLASS);
          hoveredRowRef.current = null;
        }
      }
    };

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    return () => {
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      if (hoveredRowRef.current) hoveredRowRef.current.classList.remove(HOVER_CLASS);
    };
  }, [isReady]);

  /* Mobile: long-press on message bubble opens the three-dots actions menu (Delete, Reply, etc.) */
  useEffect(() => {
    const container = streamRef.current;
    if (!container) return;

    const clearLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      longPressMessageRef.current = null;
    };

    const onTouchStart = (e) => {
      const message = e.target.closest?.('.str-chat__message');
      if (!message) return;
      if (e.target.closest?.('.str-chat__message-actions-box-button')) return;
      if (e.target.closest?.('.str-chat__message-actions-box')) return;
      longPressMessageRef.current = message;
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        const msg = longPressMessageRef.current;
        longPressMessageRef.current = null;
        if (!msg) return;
        const btn = msg.querySelector?.('[data-testid="message-actions-toggle-button"]');
        if (btn) btn.click();
      }, LONG_PRESS_MS);
    };

    const onTouchEnd = clearLongPress;
    const onTouchMove = clearLongPress;
    const onTouchCancel = clearLongPress;

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchcancel', onTouchCancel);
      clearLongPress();
    };
  }, []);

  const handleLogout = () => {
    disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  if (error && !client) {
    return (
      <div className="chat-conversation-page">
        {NavComponent && (
          <NavComponent
            active="chats"
            userName={user.userName}
            onLogout={handleLogout}
          />
        )}
        <main className="chat-conversation-main">
          <div className="chat-conversation-error">
            <p>{error}</p>
            <Link to={backTo}>← {backLabel}</Link>
          </div>
        </main>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="chat-conversation-page">
        {NavComponent && (
          <NavComponent
            active="chats"
            userName={user.userName}
            onLogout={handleLogout}
          />
        )}
        <main className="chat-conversation-main">
          <div className="chat-conversation-loading">
            <LoadingSpinner />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="chat-conversation-page">
      {NavComponent && (
        <NavComponent
          active="chats"
          userName={user.userName}
          onLogout={handleLogout}
        />
      )}
      <main className="chat-conversation-main">
        <div className="chat-conversation-wrap">
          <div className="chat-conversation-back">
            <Link to={backTo}>← {backLabel}</Link>
          </div>
          <div className="chat-conversation-stream" ref={streamRef}>
            <Chat client={client}>
              <ChatContent
                channelId={channelId}
                backTo={backTo}
                backLabel={backLabel}
              />
            </Chat>
          </div>
        </div>
      </main>
    </div>
  );
}

import FanNav from './FanNav';
import CreatorNav from './CreatorNav';

export function FanChatConversationWithProvider() {
  return (
    <ChatConversation
      backTo="/fan/chats"
      backLabel="Chats"
      NavComponent={FanNav}
    />
  );
}

export function CreatorChatConversationWithProvider() {
  return (
    <ChatConversation
      backTo="/creator/chats"
      backLabel="Chats"
      NavComponent={CreatorNav}
    />
  );
}

export default ChatConversation;
