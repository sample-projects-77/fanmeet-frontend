import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DEFAULT_AVATAR_URL } from '../constants';
import { prefetchCreatorDashboard, prefetchCreatorOffers } from '../utils/prefetch';
import BottomNav from './BottomNav';
import './CreatorNav.css';

export default function CreatorNav({ active, userName, user, avatarUrl, onLogout }) {
  const { t } = useTranslation();
  const displayName = user?.userName ?? userName ?? t('home.creator');
  const displayAvatar = user?.avatarUrl ?? avatarUrl ?? DEFAULT_AVATAR_URL;

  return (
    <>
    <header className="creator-nav">
      <div className="creator-nav-inner">
        <Link to="/creator/home" className="creator-nav-logo">
          {t('nav.fanSession')}
        </Link>
        <nav className="creator-nav-links">
          <Link to="/creator/home" className={active === 'home' ? 'active' : ''}>{t('nav.home')}</Link>
          <Link to="/creator/search" className={active === 'search' ? 'active' : ''}>{t('nav.search')}</Link>
          <Link to="/creator/dashboard" className={active === 'creator' ? 'active' : ''} onMouseEnter={() => { prefetchCreatorDashboard(); prefetchCreatorOffers(); }}>{t('nav.creator')}</Link>
          <Link to="/creator/chats" className={active === 'chats' ? 'active' : ''}>{t('nav.chats')}</Link>
          <Link to="/creator/profile" className={active === 'profile' ? 'active' : ''}>{t('nav.profile')}</Link>
        </nav>
        <div className="creator-nav-user">
          <img src={displayAvatar} alt="" className="creator-nav-avatar" />
          <span className="creator-nav-username">{displayName}</span>
          <button type="button" className="creator-nav-logout" onClick={onLogout} aria-label={t('nav.logOut')}>
            {t('nav.logOut')}
          </button>
        </div>
      </div>
    </header>
    <BottomNav variant="creator" active={active} />
    </>
  );
}
