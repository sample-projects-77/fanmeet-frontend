import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StreamChat } from 'stream-chat';
import { chatAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import { getPublicDisplayName } from '../utils/getPublicDisplayName';
import { getAccessToken } from '../utils/authStorage';

const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;

const ChatContext = createContext(null);

async function fetchStreamTokenWithRetry(maxAttempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await chatAPI.getChatToken();
      if (res.StatusCode !== 200 || !res.data?.token) {
        throw new Error(res.error || 'Failed to get chat token');
      }
      return res.data.token;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000 * (attempt + 1));
        });
      }
    }
  }
  throw lastError;
}

function getChatUserFromStorage() {
  const token = getAccessToken();
  const userJson = localStorage.getItem('user');
  if (!token || !userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function ChatProvider({ children }) {
  const [client, setClient] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const connectPromiseRef = useRef(null);

  const connectUserToStream = useCallback(async (chatClient, user) => {
    const res = await chatAPI.getChatToken();
    if (res.StatusCode !== 200 || !res.data?.token || !res.data?.userId) {
      throw new Error(res.error || 'Failed to get chat token');
    }
    const { userId } = res.data;

    if (chatClient.userID && chatClient.userID !== userId) {
      await chatClient.disconnectUser();
    }

    const displayName = getPublicDisplayName(user, 'User');
    const chatName = displayName
      ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
      : 'User';

    await chatClient.connectUser(
      {
        id: userId,
        name: chatName,
        image: user.avatarUrl || DEFAULT_AVATAR_URL,
      },
      fetchStreamTokenWithRetry
    );

    return chatClient;
  }, []);

  const connect = useCallback(async (options = {}) => {
    const { force = false } = options;

    if (!force && client?.userID) return client;
    if (!force && connectPromiseRef.current) return connectPromiseRef.current;

    if (!streamApiKey) {
      setError('REACT_APP_STREAM_API_KEY is not set');
      return null;
    }

    const user = getChatUserFromStorage();
    if (!user) return null;

    const connectTask = (async () => {
      setConnecting(true);
      setError(null);
      try {
        const chatClient = StreamChat.getInstance(streamApiKey);
        await connectUserToStream(chatClient, user);
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
  }, [client, connectUserToStream]);

  const reconnect = useCallback(async () => {
    if (!streamApiKey) {
      setClient(null);
      connectPromiseRef.current = null;
      return null;
    }

    const user = getChatUserFromStorage();
    if (!user) return null;

    connectPromiseRef.current = null;
    setConnecting(true);
    setError(null);

    try {
      const chatClient = StreamChat.getInstance(streamApiKey);
      if (chatClient.userID) {
        await chatClient.disconnectUser().catch(() => {});
      }
      await connectUserToStream(chatClient, user);
      setClient(chatClient);
      return chatClient;
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to reconnect to chat');
      setClient(null);
      return null;
    } finally {
      setConnecting(false);
    }
  }, [connectUserToStream]);

  const disconnect = useCallback(async () => {
    if (!streamApiKey) {
      setClient(null);
      connectPromiseRef.current = null;
      return;
    }
    const chatClient = client || StreamChat.getInstance(streamApiKey);
    if (chatClient?.userID) {
      await chatClient.disconnectUser().catch(() => {});
    }
    setClient(null);
    connectPromiseRef.current = null;
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

    const displayName = getPublicDisplayName(user, 'User');
    const chatName = displayName
      ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
      : 'User';
    try {
      await client.partialUpdateUser({
        id: client.userID,
        set: {
          name: chatName,
          image: user.avatarUrl || DEFAULT_AVATAR_URL,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Stream partialUpdateUser:', err?.message || err);
    }
  }, [client]);

  useEffect(() => {
    const token = getAccessToken();
    if (token && streamApiKey) {
      connect();
    }
  }, [connect]);

  useEffect(() => {
    if (!client) return undefined;

    const onConnectionChanged = (event) => {
      if (event?.online === false) {
        // eslint-disable-next-line no-console
        console.warn('Stream chat connection offline');
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !client.userID) return;
      try {
        const maybePromise = client.openConnection?.();
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.catch(() => {});
        }
      } catch {
        /* ignore reconnect errors */
      }
    };

    client.on('connection.changed', onConnectionChanged);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      client.off('connection.changed', onConnectionChanged);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [client]);

  const value = {
    client,
    connecting,
    error,
    connect,
    reconnect,
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
