import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StreamChat } from 'stream-chat';
import { chatAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';

const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [client, setClient] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const connectPromiseRef = useRef(null);

  const connect = useCallback(async () => {
    if (client) return client;
    if (connectPromiseRef.current) return connectPromiseRef.current;

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

    const connectTask = (async () => {
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
        const rawName = (user.userName || user.name || '').trim();
        const displayName = rawName
          ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
          : 'User';
        await chatClient.connectUser(
          {
            id: userId,
            name: displayName,
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
        connectPromiseRef.current = null;
      }
    })();

    connectPromiseRef.current = connectTask;
    return connectTask;
  }, [client]);

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnectUser().catch(() => {});
      setClient(null);
    }
  }, [client]);

  /**
   * After profile / avatar is saved to our API (and GetStream user upserted on the server),
   * push the latest name + image to the open Stream connection so the UI updates without reconnecting.
   */
  const syncProfileToConnectedChat = useCallback(async () => {
    if (!client?.userID) return;
    const userJson = localStorage.getItem('user');
    if (!userJson) return;
    let user;
    try {
      user = JSON.parse(userJson);
    } catch {
      return;
    }
    const prefixed = typeof user.id === 'string' ? user.id : '';
    const rawMongoId = prefixed.replace(/^(fan_|creator_)/i, '');
    if (!rawMongoId || rawMongoId !== client.userID) return;

    const rawName = (user.userName || user.name || '').trim();
    const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'User';
    try {
      await client.partialUpdateUser({
        id: client.userID,
        set: {
          name: displayName,
          image: user.avatarUrl || DEFAULT_AVATAR_URL,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Stream partialUpdateUser:', err?.message || err);
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
    syncProfileToConnectedChat,
    isReady: !!client && !connecting,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
