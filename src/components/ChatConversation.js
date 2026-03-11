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

/** Copy text to clipboard; works on mobile (Clipboard API + execCommand fallback) */
function copyToClipboard(text) {
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopy(text);
    });
    return;
  }
  fallbackCopy(text);
}
function fallbackCopy(text) {
  if (!document.queryCommandSupported?.('copy')) return;
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;left:-9999px;top:0;';
  document.body.appendChild(el);
  el.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(el);
  }
}

const CUSTOM_MESSAGE_ACTIONS = {
  'Copy Message': (message) => {
    const text = message?.text || '';
    copyToClipboard(text);
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
  const [placement, setPlacement] = useState('top-end');
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

  /* When insufficient space above (navbar), open menu below the message */
  const NAV_HEIGHT_PX = 100;
  const MENU_HEIGHT_ESTIMATE_PX = 220;
  useLayoutEffect(() => {
    if (!isOpen) {
      setPlacement('top-end');
      return;
    }
    const el = anchorEl || buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceAbove = rect.top;
    if (spaceAbove < NAV_HEIGHT_PX + MENU_HEIGHT_ESTIMATE_PX) {
      setPlacement('bottom-end');
    } else {
      setPlacement('top-end');
    }
  }, [isOpen, anchorEl]);

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

  /* When menu is open: prevent body and chat list from scrolling */
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.classList.add('fanmeet-message-menu-open');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    return () => {
      document.body.classList.remove('fanmeet-message-menu-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    };
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
        placement={placement}
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
          <div className={`fanmeet-combined-message-menu ${placement === 'bottom-end' ? 'fanmeet-combined-message-menu--below' : ''}`}>
          {placement === 'bottom-end' ? (
            <>
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
                  <button type="button" className="fanmeet-message-action" onClick={(e) => { handlePin?.(e); close(); }}>
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
              <div className="fanmeet-reaction-strip fanmeet-reaction-strip--below">
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
            </>
          ) : (
            <>
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
                  <button type="button" className="fanmeet-message-action" onClick={(e) => { handlePin?.(e); close(); }}>
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
            </>
          )}
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

const MOBILE_BREAKPOINT_PX = 1024;
const KEYBOARD_SCROLL_DELAY_MS = 350;

function scrollMessageInputIntoView() {
  if (typeof window === 'undefined' || window.innerWidth > MOBILE_BREAKPOINT_PX) return;
  const wrapper = document.querySelector('.chat-conversation-stream .str-chat__message-input-wrapper');
  const textarea = document.querySelector('.chat-conversation-stream .str-chat__message-input textarea');
  const el = textarea || wrapper;
  if (el) {
    el.scrollIntoView({ block: 'center', behavior: 'auto' });
  }
}

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

  /* Mobile: when keyboard opens (visualViewport shrinks), keep input above keyboard. Must be before any early return so hook count is stable. */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport || window.innerWidth > MOBILE_BREAKPOINT_PX) return;
    const vv = window.visualViewport;
    const onResize = () => {
      const active = document.activeElement;
      const stream = document.querySelector('.chat-conversation-stream');
      if (stream?.contains(active) && active?.matches?.('textarea')) {
        scrollMessageInputIntoView();
      }
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

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
        <MessageInput
          additionalTextareaProps={{
            placeholder: 'Type a message',
            onFocus: () => {
              setTimeout(scrollMessageInputIntoView, KEYBOARD_SCROLL_DELAY_MS);
            },
          }}
        />
      </Window>
    </Channel>
  );
}

function ChatConversation({ backTo, backLabel, NavComponent }) {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { client, connecting, error, connect, disconnect, isReady } = useChat();
  const [user, setUser] = useState(null);
  const streamRef = useRef(null);

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

  /* Mobile: tap on message bubble opens options menu (three-dots hidden by CSS on small screens).
   * Attach to document so we work regardless of when messages mount (avoids refresh-needed bug). */
  useEffect(() => {
    if (!isReady) return;

    const isMobileWidth = () => typeof window !== 'undefined' && window.innerWidth <= 1024;

    const openMessageOptions = (innerOrMessage) => {
      if (!innerOrMessage) return;
      const btn = innerOrMessage.querySelector?.('[data-testid="message-actions-toggle-button"]');
      if (btn) btn.click();
    };

    const tryOpenFromTarget = (target) => {
      if (!isMobileWidth()) return;
      const container = document.querySelector('.chat-conversation-stream');
      if (!container?.contains(target)) return;
      const bubble = target?.closest?.('.str-chat__message-bubble');
      if (!bubble) return;
      if (target?.closest?.('[data-testid="message-actions-toggle-button"]')) return;
      if (target?.closest?.('.str-chat__message-actions-box')) return;
      const innerOrMessage =
        bubble.closest?.('.str-chat__message-inner') || bubble.closest?.('.str-chat__message');
      if (innerOrMessage) openMessageOptions(innerOrMessage);
    };

    const onTouchEnd = (e) => {
      const touch = e.changedTouches?.[0];
      const target = touch ? document.elementFromPoint(touch.clientX, touch.clientY) : e.target;
      tryOpenFromTarget(target);
    };

    const onClick = (e) => {
      tryOpenFromTarget(e.target);
    };

    const onContextMenu = (e) => {
      const bubble = e.target.closest?.('.str-chat__message-bubble');
      if (bubble) e.preventDefault();
    };

    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('click', onClick, true);
    document.addEventListener('contextmenu', onContextMenu, true);

    return () => {
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, [isReady, channelId]);

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
