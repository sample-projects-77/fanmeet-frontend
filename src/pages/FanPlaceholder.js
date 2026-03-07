import React from 'react';
import { Link, useParams } from 'react-router-dom';
import './FanPlaceholder.css';

export function FanChatConversation() {
  const { channelId } = useParams();
  return (
    <div className="fan-placeholder">
      <header className="fan-placeholder-nav">
        <Link to="/fan/chats">← Chats</Link>
      </header>
      <main className="fan-placeholder-main">
        <h1>Chat</h1>
        <p>Conversation view for channel {channelId} will appear here. Coming soon.</p>
        <Link to="/fan/chats" className="fan-placeholder-back">Back to Chats</Link>
      </main>
    </div>
  );
}

export function FanCreators() {
  return (
    <div className="fan-placeholder">
      <header className="fan-placeholder-nav">
        <Link to="/fan/home">← Fan Session</Link>
      </header>
      <main className="fan-placeholder-main">
        <h1>Browse creators</h1>
        <p>This page will list creators you can book sessions with. Use Search to find creators.</p>
        <Link to="/fan/search" className="fan-placeholder-back">Go to Search</Link>
      </main>
    </div>
  );
}

export function FanCreatorOffers() {
  const { creatorId } = useParams();
  return (
    <div className="fan-placeholder">
      <header className="fan-placeholder-nav">
        <Link to={`/fan/creators/${creatorId}`}>← Creator</Link>
      </header>
      <main className="fan-placeholder-main">
        <h1>Creator offers</h1>
        <p>Offers for creator {creatorId} will appear here. Coming soon.</p>
        <Link to={`/fan/creators/${creatorId}`} className="fan-placeholder-back">Back to Creator</Link>
      </main>
    </div>
  );
}

export function FanCreatorReviews() {
  const { creatorId } = useParams();
  return (
    <div className="fan-placeholder">
      <header className="fan-placeholder-nav">
        <Link to={`/fan/creators/${creatorId}`}>← Creator</Link>
      </header>
      <main className="fan-placeholder-main">
        <h1>Creator reviews</h1>
        <p>Reviews for creator {creatorId} will appear here. Coming soon.</p>
        <Link to={`/fan/creators/${creatorId}`} className="fan-placeholder-back">Back to Creator</Link>
      </main>
    </div>
  );
}

export function FanBookings() {
  return (
    <div className="fan-placeholder">
      <header className="fan-placeholder-nav">
        <Link to="/fan/home">← Fan Session</Link>
      </header>
      <main className="fan-placeholder-main">
        <h1>My bookings</h1>
        <p>Your upcoming and past sessions will appear here. Coming soon.</p>
        <Link to="/fan/dashboard" className="fan-placeholder-back">Back to dashboard</Link>
      </main>
    </div>
  );
}
