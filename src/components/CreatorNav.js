import React from 'react';
import { Link } from 'react-router-dom';
import './CreatorNav.css';

export default function CreatorNav({ active, userName, onLogout }) {
  return (
    <header className="creator-nav">
      <div className="creator-nav-inner">
        <Link to="/creator/dashboard" className="creator-nav-logo">
          Fan Session
        </Link>
        <nav className="creator-nav-links">
          <Link to="/creator/dashboard" className={active === 'home' ? 'active' : ''}>Home</Link>
          <Link to="/creator/search" className={active === 'search' ? 'active' : ''}>Search</Link>
          <Link to="/creator/dashboard" className={active === 'creator' ? 'active' : ''}>Creator</Link>
          <Link to="/creator/chats" className={active === 'chats' ? 'active' : ''}>Chats</Link>
          <Link to="/creator/profile" className={active === 'profile' ? 'active' : ''}>Profile</Link>
        </nav>
        <div className="creator-nav-user">
          <span className="creator-nav-username">{userName ?? 'Creator'}</span>
          <button type="button" className="creator-nav-logout" onClick={onLogout} aria-label="Log out">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
