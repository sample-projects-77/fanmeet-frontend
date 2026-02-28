# FanMeet Web – GetStream Chat Integration Plan

## 1. Overview

Integrate **GetStream (Stream Chat)** into the React web app so that **fans** and **creators** can have real-time 1:1 chats. The backend already uses GetStream and exposes chat APIs; the Flutter app uses the same backend. This plan covers using those APIs and the **Stream Chat React SDK** in the web app so that:

- Fans and creators can **chat with each other**.
- **Either side can start a conversation** (fan → creator or creator → fan).
- Channel list and conversation UI are real-time and consistent with the backend channel model.

---

## 2. Current State

### 2.1 Backend (FANMEET_BACKEND)

- **Stream Chat** is used via `stream-chat` (Node) in `src/services/streamService.js` with `STREAM_API_KEY` and `STREAM_API_SECRET`.
- **Chat APIs** (see `TEST_CHAT_APIS.md` and `src/routes/chatRoutes.js`):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/chat/token` | Returns GetStream **user token** and `userId` for the authenticated user. Required for frontend to connect to Stream. |
| GET | `/api/chat/individual-channels` | Returns all **1:1 channels** for the current user (sorted by last message). |
| POST | `/api/chat/individual` | **Create or get** a 1:1 channel with another user. Body: `{ "otherUserId": "<mongoId or creator_xxx or fan_xxx>" }`. |
| DELETE | `/api/chat/individual/:channelId` | Delete a channel (member-only). |

- **Channel model**: Type `messaging`, ID format `individual-<sortedUserId1>-<userId2>` so the same channel is reused for both participants.
- **Auth**: All chat routes use `authMiddleware` (JWT). Frontend must send `Authorization: Bearer <token>`.

### 2.2 Frontend (fanmeet_frontend) – Current

- **Chat list**: `FanChats.js` and `CreatorChats.js` call `chatAPI.getIndividualChannels()` and render a list with links to `/fan/chats/:channelId` and `/creator/chats/:channelId`.
- **Conversation**: Routes point to `FanChatConversation` and `CreatorChatConversation` in placeholder files; they only show “Coming soon” and do **not** use GetStream or any real messaging.
- **API layer** (`services/api.js`): Only `chatAPI.getIndividualChannels()` exists. Missing: `getChatToken`, `createOrGetIndividualChannel` (and optionally delete).
- **Gap**: Backend returns `otherMemberId` per channel but **not** `otherMemberDisplayName` or `otherMemberAvatarUrl`. The list UI expects those for labels/avatars; currently they are undefined so “User” is shown.

### 2.3 GetStream (Flutter / Backend)

- Backend creates users in Stream via `streamClient.upsertUser()` and uses `streamClient.createToken(userId)` for tokens.
- Channel creation uses `streamClient.channel('messaging', 'individual-' + channelId, { members: [userId, otherUserId] })`. Flutter app uses the same APIs; web will use the **same backend endpoints** and the **Stream Chat React SDK** for the UI.

---

## 3. Architecture (Web)

- **Auth**: User logs in → JWT in `localStorage` → used for all backend calls.
- **Stream connection**: On chat entry (e.g. Chats page or conversation page), frontend:
  1. Calls `GET /api/chat/token` to get Stream `userId` and **token**.
  2. Initializes **Stream Chat client** with the **public** `STREAM_API_KEY` (env).
  3. Calls `client.connectUser({ id, name, image }, token)` so all Stream SDK calls (channel list, messages, send) are authenticated.
- **Channel list**: Can be either:
  - **A)** Fetched from backend `GET /api/chat/individual-channels` and then “watched” in Stream for real-time updates, or  
  - **B)** Fetched directly from Stream via the SDK (e.g. `client.queryChannels`) using the same filters as the backend.  
  Plan: use **backend list** for consistency and to attach enriched fields (other member name/avatar); optionally sync with Stream for live updates.
- **Opening a conversation**: When user opens `/fan/chats/:channelId` or `/creator/chats/:channelId`, frontend gets `channelId` from the URL, ensures client is connected, then uses Stream SDK `client.channel('messaging', channelId)` and **Channel** + **MessageList** + **MessageInput** to show and send messages.
- **Starting a new chat**: From a creator profile (fan) or fan/creator list (creator), “Message” / “Chat” calls `POST /api/chat/individual` with `otherUserId` (creator or fan id). Backend returns the channel; frontend redirects to `/fan/chats/:channelId` or `/creator/chats/:channelId`.

---

## 4. Backend Adjustments (Optional but Recommended)

- **Enrich `GET /api/chat/individual-channels`**  
  For each channel, backend already has `otherMemberId`. Look up `User` by that id and add to the payload, e.g.:
  - `otherMemberDisplayName`: `user.userName || user.name || 'User'`
  - `otherMemberAvatarUrl`: `user.avatarUrl || null`  
  So the list view can show correct name and avatar without extra frontend calls.

---

## 5. Frontend Implementation Plan

### 5.1 Dependencies

- Add **stream-chat** and **stream-chat-react** (and peer deps if required by stream-chat-react).
- Ensure React version is compatible (current app is React 18).

### 5.2 Environment

- Add **REACT_APP_STREAM_API_KEY** (Stream’s **public** API key; same value as backend’s `STREAM_API_KEY`). No secret on frontend.

### 5.3 API Layer (`services/api.js`)

- **chatAPI.getChatToken()**: `GET /api/chat/token` → returns `{ token, userId }`.
- **chatAPI.createOrGetIndividualChannel(otherUserId)**: `POST /api/chat/individual` with `{ otherUserId }` → returns `{ channel }` (include `channel.id` for navigation).
- Optionally: **chatAPI.deleteChannel(channelId)** for “delete conversation” if product requires it.

### 5.4 Stream Chat Provider (shared)

- Create a small **ChatProvider** (or equivalent) that:
  - Reads JWT from `localStorage` and calls `getChatToken()`.
  - Initializes `StreamChat` with `REACT_APP_STREAM_API_KEY`.
  - Calls `client.connectUser({ id: userId, name, image }, token)` using current user from `localStorage` (or from a small “current user” context).
  - Exposes the connected **client** (and optionally current user) via React context so list and conversation components can use it.
  - Handles disconnect on logout and re-connect when token/user changes.

Wrap the chat routes (or the whole app) in this provider so any chat page has access to the connected client.

### 5.5 Channel List Page (Fan / Creator)

- **FanChats.js** / **CreatorChats.js** (keep existing layout and nav):
  - Continue using `chatAPI.getIndividualChannels()` for the list.
  - Use enriched `otherMemberDisplayName` and `otherMemberAvatarUrl` when available; fallback to `otherMemberId` or “User”.
  - Keep existing links: `/fan/chats/:channelId` and `/creator/chats/:channelId` (channelId = backend `channel.id`, e.g. `individual-uid1-uid2`).
  - Optional: After connecting Stream client, subscribe to channel list updates so new messages or new channels update the list in real time (e.g. refetch or use Stream’s channel list state).

### 5.6 Conversation Page (GetStream UI)

- Replace **FanChatConversation** and **CreatorChatConversation** placeholders with a real implementation (can be one shared component with different nav/routes):
  - Ensure **ChatProvider** is mounted (user connected to Stream).
  - From route param get `channelId` (e.g. `individual-uid1-uid2`).
  - Use Stream React SDK:
    - **Channel** with `channel={client.channel('messaging', channelId)}` (and ensure channel is watched).
    - **ChannelHeader** (optional): show other user’s name; can use channel state or pass from list.
    - **MessageList**: show messages.
    - **MessageInput**: send messages.
  - Handle “channel not found” or “not a member” (e.g. redirect back to list or show error).
  - Back link: to `/fan/chats` or `/creator/chats` depending on role.

### 5.7 “Start chat” Entry Points

- **Fan**: On creator profile (`FanCreatorProfile.js`), add a “Message” / “Chat” button that:
  - Calls `chatAPI.createOrGetIndividualChannel(creatorId)` (creatorId can be with or without `creator_` prefix; backend accepts both).
  - On success, navigate to `/fan/chats/<channel.id>`.
- **Creator**: Where creators see a list of fans or a fan profile (e.g. from bookings or search), add “Message” / “Chat” that:
  - Calls `chatAPI.createOrGetIndividualChannel(fanUserId)`.
  - Navigate to `/creator/chats/<channel.id>`.

This satisfies “anyone can start the chat.”

### 5.8 Permissions and Safety

- Backend already enforces: only authenticated user, only their channels, and “no self-chat.” No change needed for basic security.
- Frontend: only render chat UI when user is logged in; use existing auth checks (redirect to login if no token).

### 5.9 Styling and UX

- Use **stream-chat-react** theme/customization so the chat matches the app (colors, fonts).
- Keep existing Fan/Creator nav and layout; embed the Stream **Channel** + **MessageList** + **MessageInput** in the main content area.
- Mobile: consider a single-column layout (list → tap → conversation) that matches the current links.

---

## 6. Implementation Order

1. **Backend (optional)**: Enrich `getIndividualChannels` with `otherMemberDisplayName` and `otherMemberAvatarUrl`.
2. **Frontend – setup**: Add `stream-chat` + `stream-chat-react`, `REACT_APP_STREAM_API_KEY`, and `getChatToken` + `createOrGetIndividualChannel` in `api.js`.
3. **Frontend – provider**: Implement ChatProvider (connect user with token from backend, expose client via context).
4. **Frontend – conversation**: Replace FanChatConversation and CreatorChatConversation with GetStream Channel + MessageList + MessageInput; connect using `channelId` from route.
5. **Frontend – list**: Ensure channel list uses enriched fields and correct links; optionally add real-time refresh.
6. **Frontend – start chat**: Add “Message” / “Chat” on Fan creator profile and Creator side (fan list/profile) with create-or-get + redirect.

---

## 7. Testing Checklist

- [ ] Fan logs in → opens Chats → sees empty list or existing channels with correct names/avatars.
- [ ] Fan opens a channel → sees message list and can send messages; creator sees them in real time (and vice versa).
- [ ] Fan starts chat from creator profile → new channel is created and fan is redirected to conversation.
- [ ] Creator starts chat with a fan → same behavior.
- [ ] Refresh on conversation page: channel and messages load correctly.
- [ ] Logout: Stream client disconnects; after login again, chat works with the same backend token/channels.

---

## 8. Summary

- **Backend**: Keep existing GetStream integration and chat APIs; optionally enrich channel list with other member display name and avatar.
- **Frontend**: Add Stream Chat React SDK, connect using token from existing `GET /api/chat/token`, implement conversation view with Channel + MessageList + MessageInput, and add “start chat” from fan and creator entry points using `POST /api/chat/individual`.

Once you give the go-ahead, implementation can follow the order in **Section 6**.
