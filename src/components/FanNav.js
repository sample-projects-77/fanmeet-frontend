import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DEFAULT_AVATAR_URL } from '../constants';
import { prefetchFanDashboard } from '../utils/prefetch';
import BottomNav from './BottomNav';
import './FanNav.css';

export default function FanNav({ active, userName, user, avatarUrl, onLogout }) {
  const { t } = useTranslation();
  const displayName = user?.userName ?? userName ?? t('home.fan');
  const displayAvatar = user?.avatarUrl ?? avatarUrl ?? DEFAULT_AVATAR_URL;

  return (
    <>
    <header className="fan-nav">
      <div className="fan-nav-inner">
        <Link to="/fan/home" className="fan-nav-logo">
          {t('nav.fanSession')}
        </Link>
        <nav className="fan-nav-links">
          <Link to="/fan/home" className={active === 'home' ? 'active' : ''}>{t('nav.home')}</Link>
          <Link to="/fan/search" className={active === 'search' ? 'active' : ''}>{t('nav.search')}</Link>
          <Link to="/fan/dashboard" className={active === 'fan' ? 'active' : ''} onMouseEnter={prefetchFanDashboard}>{t('nav.fan')}</Link>
          <Link to="/fan/chats" className={active === 'chats' ? 'active' : ''}>{t('nav.chats')}</Link>
          <Link to="/fan/profile" className={active === 'profile' ? 'active' : ''}>{t('nav.profile')}</Link>
        </nav>
        <div className="fan-nav-user">
          <img src={displayAvatar} alt="" className="fan-nav-avatar" />
          <span className="fan-nav-username">{displayName}</span>
          <button type="button" className="fan-nav-logout" onClick={onLogout} aria-label={t('nav.logOut')}>
            {t('nav.logOut')}
          </button>
        </div>
      </div>
    </header>
    <BottomNav variant="fan" active={active} />
    </>
  );
}
