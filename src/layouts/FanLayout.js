import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import FanNav from '../components/FanNav';
import { clearAllCached } from '../utils/routeDataCache';
import { preloadFanData } from '../utils/prefetch';
import FanHome from '../pages/FanHome';
import FanSearch from '../pages/FanSearch';
import FanDashboard from '../pages/FanDashboard';
import FanChats from '../pages/FanChats';
import FanProfile from '../pages/FanProfile';
import './FanLayout.css';

const TAB_PATHS = ['/fan/home', '/fan/search', '/fan/dashboard', '/fan/chats', '/fan/profile'];

const PATH_TO_TAB = {
  '/fan/home': 'home',
  '/fan/search': 'search',
  '/fan/dashboard': 'dashboard',
  '/fan/chats': 'chats',
  '/fan/profile': 'profile',
};

const TAB_TO_NAV_ACTIVE = {
  home: 'home',
  search: 'search',
  dashboard: 'fan',
  chats: 'chats',
  profile: 'profile',
};

const TAB_COMPONENTS = {
  home: FanHome,
  search: FanSearch,
  dashboard: FanDashboard,
  chats: FanChats,
  profile: FanProfile,
};

export default function FanLayout() {
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

  // Preload all tab data once after login; tabs then use cached data only (no refetch on tab switch)
  useEffect(() => {
    if (user) preloadFanData();
  }, [user]);

  useEffect(() => {
    if (currentTabKey && !mountedTabs.includes(currentTabKey)) {
      setMountedTabs((prev) => [...prev, currentTabKey]);
    }
  }, [currentTabKey, mountedTabs]);

  // Scroll to top whenever the active tab changes
  React.useLayoutEffect(() => {
    if (currentTabKey) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [currentTabKey]);

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
          className="fan-layout-tab"
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
        <FanNav active={navActive} user={user} onLogout={handleLogout} />
        <div className="fan-layout-content">
          {layoutContent}
        </div>
      </>
    );
  }

  return <Outlet />;
}
