import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import CreatorNav from '../components/CreatorNav';
import { clearAllCached } from '../utils/routeDataCache';
import CreatorHome from '../pages/CreatorHome';
import CreatorSearch from '../pages/CreatorSearch';
import CreatorDashboard from '../pages/CreatorDashboard';
import CreatorChats from '../pages/CreatorChats';
import CreatorProfile from '../pages/CreatorProfile';
import './CreatorLayout.css';

const TAB_PATHS = ['/creator/home', '/creator/search', '/creator/dashboard', '/creator/chats', '/creator/profile'];

const PATH_TO_TAB = {
  '/creator/home': 'home',
  '/creator/search': 'search',
  '/creator/dashboard': 'dashboard',
  '/creator/chats': 'chats',
  '/creator/profile': 'profile',
};

const TAB_TO_NAV_ACTIVE = {
  home: 'home',
  search: 'search',
  dashboard: 'creator',
  chats: 'chats',
  profile: 'profile',
};

const TAB_COMPONENTS = {
  home: CreatorHome,
  search: CreatorSearch,
  dashboard: CreatorDashboard,
  chats: CreatorChats,
  profile: CreatorProfile,
};

export default function CreatorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [user, setUser] = useState(null);
  const [mountedTabs, setMountedTabs] = useState(() => {
    const tab = PATH_TO_TAB[pathname];
    return tab ? [tab] : [];
  });

  const isTabPath = TAB_PATHS.includes(pathname);
  const currentTabKey = PATH_TO_TAB[pathname];
  const navActive = currentTabKey ? TAB_TO_NAV_ACTIVE[currentTabKey] : 'home';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (currentTabKey && !mountedTabs.includes(currentTabKey)) {
      setMountedTabs((prev) => [...prev, currentTabKey]);
    }
  }, [currentTabKey, mountedTabs]);

  const handleLogout = () => {
    clearAllCached();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const layoutContent = useMemo(() => {
    if (!isTabPath) return null;
    return mountedTabs.map((tabKey) => {
      const Component = TAB_COMPONENTS[tabKey];
      if (!Component) return null;
      const isActive = tabKey === currentTabKey;
      return (
        <div
          key={tabKey}
          className="creator-layout-tab"
          style={{ display: isActive ? 'block' : 'none' }}
          aria-hidden={!isActive}
        >
          <Component
            embedded
            user={user}
            onLogout={handleLogout}
          />
        </div>
      );
    });
  }, [isTabPath, mountedTabs, currentTabKey, user]);

  if (!user) return null;

  if (isTabPath) {
    return (
      <>
        <CreatorNav active={navActive} user={user} onLogout={handleLogout} />
        <div className="creator-layout-content">
          {layoutContent}
        </div>
      </>
    );
  }

  return <Outlet />;
}
