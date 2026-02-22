import React from 'react';
import { Link, useParams } from 'react-router-dom';
import './FanPlaceholder.css';

function BackLink({ to, label }) {
  return (
    <header className="fan-placeholder-nav">
      <Link to={to}>← {label}</Link>
    </header>
  );
}

export function CreatorChatConversation() {
  const { channelId } = useParams();
  return (
    <div className="fan-placeholder">
      <BackLink to="/creator/chats" label="Chats" />
      <main className="fan-placeholder-main">
        <h1>Chat</h1>
        <p>Conversation view for channel {channelId} will appear here. Coming soon.</p>
        <Link to="/creator/chats" className="fan-placeholder-back">Back to Chats</Link>
      </main>
    </div>
  );
}

export function CreatorReviews() {
  return (
    <div className="fan-placeholder">
      <BackLink to="/creator/profile" label="Profile" />
      <main className="fan-placeholder-main">
        <h1>Reviews</h1>
        <p>Your reviews. Coming soon.</p>
        <Link to="/creator/profile" className="fan-placeholder-back">Back to Profile</Link>
      </main>
    </div>
  );
}
