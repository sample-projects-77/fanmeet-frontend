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

export function CreatorCreatorOffers() {
  const { creatorId } = useParams();
  return (
    <div className="fan-placeholder">
      <BackLink to={`/creator/creators/${creatorId}`} label="Creator" />
      <main className="fan-placeholder-main">
        <h1>Creator offers</h1>
        <p>Offers for this creator will appear here. Coming soon.</p>
        <Link to={`/creator/creators/${creatorId}`} className="fan-placeholder-back">Back to Creator</Link>
      </main>
    </div>
  );
}

export function CreatorCreatorReviews() {
  const { creatorId } = useParams();
  return (
    <div className="fan-placeholder">
      <BackLink to={`/creator/creators/${creatorId}`} label="Creator" />
      <main className="fan-placeholder-main">
        <h1>Creator reviews</h1>
        <p>Reviews for this creator will appear here. Coming soon.</p>
        <Link to={`/creator/creators/${creatorId}`} className="fan-placeholder-back">Back to Creator</Link>
      </main>
    </div>
  );
}

export function CreatorProfileEdit() {
  return (
    <div className="fan-placeholder">
      <BackLink to="/creator/profile" label="Profile" />
      <main className="fan-placeholder-main">
        <h1>Edit profile</h1>
        <p>Edit your creator profile. Coming soon.</p>
        <Link to="/creator/profile" className="fan-placeholder-back">Back to Profile</Link>
      </main>
    </div>
  );
}

export function CreatorProfileChangePassword() {
  return (
    <div className="fan-placeholder">
      <BackLink to="/creator/profile" label="Profile" />
      <main className="fan-placeholder-main">
        <h1>Change password</h1>
        <p>Change your password. Coming soon.</p>
        <Link to="/creator/profile" className="fan-placeholder-back">Back to Profile</Link>
      </main>
    </div>
  );
}

export function CreatorProfileLanguage() {
  return (
    <div className="fan-placeholder">
      <BackLink to="/creator/profile" label="Profile" />
      <main className="fan-placeholder-main">
        <h1>Change language</h1>
        <p>Choose your preferred language. Coming soon.</p>
        <Link to="/creator/profile" className="fan-placeholder-back">Back to Profile</Link>
      </main>
    </div>
  );
}

export function CreatorProfileBlocked() {
  return (
    <div className="fan-placeholder">
      <BackLink to="/creator/profile" label="Profile" />
      <main className="fan-placeholder-main">
        <h1>Blocked users</h1>
        <p>Manage blocked users. Coming soon.</p>
        <Link to="/creator/profile" className="fan-placeholder-back">Back to Profile</Link>
      </main>
    </div>
  );
}
