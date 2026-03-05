import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StreamChat } from 'stream-chat';
import { chatAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';

const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [client, setClient] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    if (!streamApiKey) {
      setError('REACT_APP_STREAM_API_KEY is not set');
      return null;
    }
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) return null;

    let user;
    try {
      user = JSON.parse(userJson);
    } catch {
      return null;
    }

    setConnecting(true);
    setError(null);
    try {
      const res = await chatAPI.getChatToken();
      if (res.StatusCode !== 200 || !res.data?.token || !res.data?.userId) {
        setError(res.error || 'Failed to get chat token');
        return null;
      }
      const { token: streamToken, userId } = res.data;
      const chatClient = StreamChat.getInstance(streamApiKey);
      await chatClient.connectUser(
        {
          id: userId,
          name: user.userName || user.name || 'User',
          image: user.avatarUrl || DEFAULT_AVATAR_URL,
        },
        streamToken
      );
      setClient(chatClient);
      return chatClient;
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to connect to chat');
      setClient(null);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnectUser().catch(() => {});
      setClient(null);
    }
  }, [client]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && streamApiKey) {
      connect();
    }
  }, []);

  const value = {
    client,
    connecting,
    error,
    connect,
    disconnect,
    isReady: !!client && !connecting,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
