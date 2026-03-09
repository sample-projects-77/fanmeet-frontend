import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  HomeOutlined,
  Search,
  SearchOutlined,
  People,
  PeopleOutlined,
  ChatBubble,
  AccountCircle,
  AccountCircleOutlined,
} from '@mui/icons-material';
import './BottomNav.css';

/* Outlined chat bubble (stroke-only) so unselected state is clearly outline, not filled */
const ChatsIconOutlined = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
  </svg>
);

const HomeIcon = ({ active }) => active ? <Home fontSize="small" /> : <HomeOutlined fontSize="small" />;
const SearchIcon = ({ active }) => active ? <Search fontSize="small" /> : <SearchOutlined fontSize="small" />;
const CreatorIcon = ({ active }) => active ? <People fontSize="small" /> : <PeopleOutlined fontSize="small" />;
const ChatsIcon = ({ active }) => active ? <ChatBubble fontSize="small" /> : <ChatsIconOutlined />;
const ProfileIcon = ({ active }) => active ? <AccountCircle fontSize="small" /> : <AccountCircleOutlined fontSize="small" />;

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
