import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Chat,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
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
    <Channel channel={channel}>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput additionalTextareaProps={{ placeholder: 'Type a message' }} />
      </Window>
    </Channel>
  );
}

function ChatConversation({ backTo, backLabel, NavComponent }) {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { client, connecting, error, connect, disconnect, isReady } = useChat();
  const [user, setUser] = useState(null);

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
          <div className="chat-conversation-stream">
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
