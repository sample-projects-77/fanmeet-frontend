import React from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_AVATAR_URL } from '../constants';
import './FanNav.css';

export default function FanNav({ active, userName, user, avatarUrl, onLogout }) {
  const displayName = user?.userName ?? userName ?? 'Fan';
  const displayAvatar = user?.avatarUrl ?? avatarUrl ?? DEFAULT_AVATAR_URL;

  return (
    <header className="fan-nav">
      <div className="fan-nav-inner">
        <Link to="/fan/home" className="fan-nav-logo">
          Fan Session
        </Link>
        <nav className="fan-nav-links">
          <Link to="/fan/home" className={active === 'home' ? 'active' : ''}>Home</Link>
          <Link to="/fan/search" className={active === 'search' ? 'active' : ''}>Search</Link>
          <Link to="/fan/home" className={active === 'fan' ? 'active' : ''}>Fan</Link>
          <Link to="/fan/chats" className={active === 'chats' ? 'active' : ''}>Chats</Link>
          <Link to="/fan/profile" className={active === 'profile' ? 'active' : ''}>Profile</Link>
        </nav>
        <div className="fan-nav-user">
          <img src={displayAvatar} alt="" className="fan-nav-avatar" />
          <span className="fan-nav-username">{displayName}</span>
          <button type="button" className="fan-nav-logout" onClick={onLogout} aria-label="Log out">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
