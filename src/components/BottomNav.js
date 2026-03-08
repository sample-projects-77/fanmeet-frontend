import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './BottomNav.css';

const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    {active ? (
      <path d="M11.03 2.59a1.5 1.5 0 0 1 1.94 0l7.5 6.363a1.5 1.5 0 0 1 .53 1.118V20a1.5 1.5 0 0 1-1.5 1.5h-5.75a1.5 1.5 0 0 1-1.5-1.5v-5.75h-3.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.93a1.5 1.5 0 0 1 .53-1.118l7.5-6.363z" fill="currentColor"/>
    ) : (
      <path d="M11.03 2.59a1.5 1.5 0 0 1 1.94 0l7.5 6.363a1.5 1.5 0 0 1 .53 1.118V20a1.5 1.5 0 0 1-1.5 1.5h-5.75a1.5 1.5 0 0 1-1.5-1.5v-5.75h-3.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.93a1.5 1.5 0 0 1 .53-1.118l7.5-6.363z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
);

const SearchIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill={active ? 'currentColor' : 'none'} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 16l4 4" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
  </svg>
);

const CreatorIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChatsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill={active ? 'currentColor' : 'none'} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill={active ? 'currentColor' : 'none'} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Bottom navigation bar for mobile and tablet only.
 * variant: 'creator' | 'fan'
 * active: 'home' | 'search' | 'creator' | 'fan' | 'chats' | 'profile'
 */
export default function BottomNav({ variant, active }) {
  const { t } = useTranslation();

  const isCreator = variant === 'creator';
  const basePath = isCreator ? '/creator' : '/fan';
  const dashboardKey = isCreator ? 'creator' : 'fan';

  const items = [
    { key: 'home', path: `${basePath}/home`, label: t('nav.home'), Icon: HomeIcon },
    { key: 'search', path: `${basePath}/search`, label: t('nav.search'), Icon: SearchIcon },
    { key: dashboardKey, path: isCreator ? `${basePath}/dashboard` : `${basePath}/dashboard`, label: t(isCreator ? 'nav.creator' : 'nav.fan'), Icon: CreatorIcon },
    { key: 'chats', path: `${basePath}/chats`, label: t('nav.chats'), Icon: ChatsIcon },
    { key: 'profile', path: `${basePath}/profile`, label: t('nav.profile'), Icon: ProfileIcon },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label={t('nav.home')}>
      <div className="bottom-nav-inner">
        {items.map(({ key, path, label, Icon }) => {
          const isActive = active === key;
          return (
            <Link
              key={key}
              to={path}
              className={`bottom-nav-item ${isActive ? 'bottom-nav-item--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="bottom-nav-icon">
                <Icon active={isActive} />
              </span>
              <span className="bottom-nav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
