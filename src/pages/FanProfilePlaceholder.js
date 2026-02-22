import React from 'react';
import { Link } from 'react-router-dom';
import './FanPlaceholder.css';

function BackLink() {
  return (
    <header className="fan-placeholder-nav">
      <Link to="/fan/profile">← Profile</Link>
    </header>
  );
}

export function FanProfileChangePassword() {
  return (
    <div className="fan-placeholder">
      <BackLink />
      <main className="fan-placeholder-main">
        <h1>Change Password</h1>
        <p>Enter your current password and choose a new one. Coming soon.</p>
        <Link to="/fan/profile" className="fan-placeholder-back">Back to Profile</Link>
      </main>
    </div>
  );
}

export function FanProfileLanguage() {
  return (
    <div className="fan-placeholder">
      <BackLink />
      <main className="fan-placeholder-main">
        <h1>Change Language</h1>
        <p>Select your preferred language. Coming soon.</p>
        <Link to="/fan/profile" className="fan-placeholder-back">Back to Profile</Link>
      </main>
    </div>
  );
}

export function FanProfileBlocked() {
  return (
    <div className="fan-placeholder">
      <BackLink />
      <main className="fan-placeholder-main">
        <h1>Blocked Users</h1>
        <p>Manage users you have blocked. Coming soon.</p>
        <Link to="/fan/profile" className="fan-placeholder-back">Back to Profile</Link>
      </main>
    </div>
  );
}
