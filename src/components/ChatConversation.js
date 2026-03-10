import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Chat,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  useChatContext,
  StreamEmoji,
  DialogAnchor,
  useDialogOnNearestManager,
  useDialogIsOpen,
  useMessageContext,
  useTranslationContext,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

function ThreeDotsIcon({ className = '' }) {
  return (
    <svg className={className} height="4" viewBox="0 0 11 4" width="11" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fillRule="nonzero" />
    </svg>
  );
}

/* Emoji types that exist in Stream's sprite (StreamEmoji); others must use fallback only to avoid "position is not iterable" */
const STREAM_SPRITE_TYPES = new Set(['love', 'like', 'haha', 'wow', 'sad', 'angry']);

function ReactionEmoji({ fallback, type }) {
  if (STREAM_SPRITE_TYPES.has(type)) {
    return <StreamEmoji fallback={fallback} type={type} />;
  }
  return <span role="img" aria-label={type}>{fallback}</span>;
}

/* Reaction options: heart, thumbs up, thumbs down, LOL, ?! (match reference UI) */
const CHAT_REACTION_OPTIONS = [
  { type: 'love', Component: () => <ReactionEmoji fallback="❤️" type="love" />, name: 'Heart' },
  { type: 'like', Component: () => <ReactionEmoji fallback="👍" type="like" />, name: 'Thumbs up' },
  { type: 'dislike', Component: () => <ReactionEmoji fallback="👎" type="dislike" />, name: 'Thumbs down' },
  { type: 'haha', Component: () => <ReactionEmoji fallback="😂" type="haha" />, name: 'LOL' },
  { type: 'wow', Component: () => <ReactionEmoji fallback="⁉️" type="wow" />, name: '?!' },
];

const CUSTOM_MESSAGE_ACTIONS = {
  'Copy Message': (message) => {
    const text = message?.text || '';
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
  },
};

/**
 * One menu above the message: emoji reactions bar + Edit, Copy, Pin, Delete.
 * Opens when clicking the three-dots (no separate emoji button).
 */
function CombinedMessageOptions() {
  const {
    message,
    threadList,
    getMessageActions,
    setEditingState,
    handleDelete,
    handlePin,
    handleReaction,
    customMessageActions,
    initialMessage,
  } = useMessageContext('CombinedMessageOptions');
  const { t } = useTranslationContext('CombinedMessageOptions');
  const buttonRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const dialogIdNamespace = threadList ? '-thread-' : '';
  const dialogId = `message-actions${dialogIdNamespace}--${message?.id}`;
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const isOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  /* Align menu with message bubble (chat div) instead of the three-dots button */
  useLayoutEffect(() => {
    const inner = buttonRef.current?.closest('.str-chat__message-inner');
    const bubble = inner?.querySelector('.str-chat__message-bubble') || inner;
    setAnchorEl(bubble || null);
  }, []);

  /* Keep menu below nav bar: clamp top so it never goes under the header */
  const MIN_TOP_PX = 56;
  useEffect(() => {
    if (!isOpen) return;
    const run = () => {
      const wrapper = document.querySelector('.fanmeet-combined-message-menu')?.closest('.str-chat__dialog-contents');
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      if (rect.top < MIN_TOP_PX) {
        wrapper.style.top = `${MIN_TOP_PX}px`;
      }
    };
    const id = requestAnimationFrame(() => requestAnimationFrame(run));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  /* When menu is open: highlight message row (above backdrop) and show blurred backdrop */
  useEffect(() => {
    const row = buttonRef.current?.closest('li') || buttonRef.current?.closest('.str-chat__message') || buttonRef.current?.closest('[class*="virtual-list-message"]');
    if (!row) return;
    const className = 'fanmeet-message-menu-open';
    if (isOpen) {
      row.classList.add(className);
    } else {
      row.classList.remove(className);
    }
    return () => row.classList.remove(className);
  }, [isOpen]);

  if (
    !message?.type ||
    message.type === 'error' ||
    message.type === 'system' ||
    message.type === 'ephemeral' ||
    message.status === 'failed' ||
    message.status === 'sending' ||
    initialMessage
  ) {
    return null;
  }

  const messageActions = getMessageActions();
  const hasEdit = messageActions.indexOf('edit') > -1;
  const hasPin = messageActions.indexOf('pin') > -1;
  const hasDelete = messageActions.indexOf('delete') > -1;
  const close = () => dialog?.close();

  return (
    <div
      className={`str-chat__message-simple__actions str-chat__message-options ${isOpen ? 'str-chat__message-options--active' : ''}`}
      data-testid="message-options"
    >
      <DialogAnchor
        dialogManagerId={dialogManager?.id}
        id={dialogId}
        placement="top-end"
        referenceElement={anchorEl || buttonRef.current}
        tabIndex={-1}
        trapFocus
      >
        <>
          <div
            className="fanmeet-message-menu-backdrop"
            onClick={() => dialog?.close()}
            onKeyDown={(e) => e.key === 'Escape' && dialog?.close()}
            role="presentation"
            aria-hidden
          />
          <div className="fanmeet-combined-message-menu">
          <div className="fanmeet-reaction-strip">
            {CHAT_REACTION_OPTIONS.map(({ type, Component }) => (
              <button
                key={type}
                type="button"
                className="fanmeet-reaction-option"
                onClick={(e) => {
                  handleReaction?.(type, e);
                  close();
                }}
                aria-label={`React ${type}`}
              >
                <Component />
              </button>
            ))}
          </div>
          <div className="fanmeet-message-actions-list">
            {customMessageActions?.['Copy Message'] && (
              <button
                type="button"
                className="fanmeet-message-action"
                onClick={() => {
                  customMessageActions['Copy Message'](message);
                  close();
                }}
              >
                {t('Copy Message') || 'Copy Message'}
              </button>
            )}
            {hasEdit && (
              <button type="button" className="fanmeet-message-action" onClick={() => { setEditingState?.(); close(); }}>
                {t('Edit Message') || 'Edit Message'}
              </button>
            )}
            {hasPin && !message.parent_id && (
              <button type="button" className="fanmeet-message-action" onClick={() => { handlePin?.(); close(); }}>
                {message.pinned ? (t('Unpin') || 'Unpin') : (t('Pin to Conversation') || 'Pin to Conversation')}
              </button>
            )}
            {hasDelete && (
              <button
                type="button"
                className="fanmeet-message-action fanmeet-message-action--delete"
                onClick={(e) => { handleDelete?.(e); close(); }}
              >
                {t('Delete Message') || 'Delete Message'}
              </button>
            )}
          </div>
        </div>
        </>
      </DialogAnchor>
      <div className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options str-chat__message-actions-container">
        <button
          type="button"
          ref={buttonRef}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={t('aria/Open Message Actions Menu') || 'Message options'}
          className="str-chat__message-actions-box-button"
          data-testid="message-actions-toggle-button"
          onClick={() => dialog?.toggle()}
        >
          <ThreeDotsIcon className="str-chat__message-action-icon" />
        </button>
      </div>
    </div>
  );
}

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
      MessageOptions={CombinedMessageOptions}
      reactionOptions={CHAT_REACTION_OPTIONS}
    >
      <Window>
        <ChannelHeader />
        <MessageList
          customMessageActions={CUSTOM_MESSAGE_ACTIONS}
          messageActions={['edit', 'pin', 'delete', 'react']}
        />
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
      /* Only handle long-press when touch starts on the message bubble (not avatar, timestamp, etc.) */
      const bubble = e.target.closest?.('.str-chat__message-bubble');
      if (!bubble) return;
      const message = bubble.closest?.('.str-chat__message');
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
