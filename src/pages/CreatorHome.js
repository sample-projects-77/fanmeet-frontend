import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { profileAPI } from '../services/api';
import { getCached, setCached } from '../utils/routeDataCache';
import { DEFAULT_AVATAR_URL } from '../constants';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorHome.css';
import './CreatorSearch.css';

const ITEMS_PER_PAGE = 20;
const CACHE_KEY = 'homeCreators';

function CreatorHome({ embedded, user: userProp, onLogout: onLogoutProp }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userState, setUserState] = useState(null);
  const user = embedded ? userProp : userState;
  const handleLogout = embedded ? onLogoutProp : () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      setUserState(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const fetchCreators = useCallback(async (page = 1, append = false, backgroundRefresh = false) => {
    if (append) {
      setLoadingMore(true);
    } else if (!backgroundRefresh) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await profileAPI.getCreators({ page, itemsPerPage: ITEMS_PER_PAGE });
      if (res.StatusCode === 200 && res.data) {
        const list = res.data.creators || [];
        setCreators((prev) => (append ? [...prev, ...list] : list));
        const pagination = res.data.pagination || {};
        setHasNextPage(!!pagination.hasNextPage);
        setCurrentPage(pagination.currentPage ?? page);
        if (!append) setCached(CACHE_KEY, { creators: list, pagination });
      } else {
        if (!append) {
          setError(res.error || t('search.failedToLoad'));
          setCreators([]);
        }
      }
    } catch (err) {
      if (!append) {
        setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
        setCreators([]);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    if (!user) return;
    const cached = getCached(CACHE_KEY);
    if (cached?.creators) {
      setCreators(cached.creators);
      setHasNextPage(!!cached.pagination?.hasNextPage);
      setCurrentPage(cached.pagination?.currentPage ?? 1);
      setLoading(false);
      setError(null);
    } else {
      fetchCreators(1, false, false);
    }
  }, [user, fetchCreators]);

  useEffect(() => {
    if (!hasNextPage || loadingMore || loading) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchCreators(currentPage + 1, true);
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loading, currentPage, fetchCreators]);

  if (!user) return null;

  const displayName = user?.userName ?? t('home.creator');
  const priceStr = (cents) => (cents != null ? `${(cents / 100).toFixed(0)} €` : '—');
  const durationStr = (durations) =>
    durations?.length ? `${Math.min(...durations)} ${t('common.min')}` : '—';

  return (
    <div className="creator-home-page">
      {!embedded && <CreatorNav active="home" user={user} onLogout={handleLogout} />}
      <main className="creator-home-main">
        <div className="creator-home-container">
          <section className="creator-home-hero">
            <h1 className="creator-home-title">{t('home.title')}</h1>
            <p className="creator-home-welcome">{t('home.welcomeBack', { name: displayName })}</p>
            <p className="creator-home-greeting">{t('home.greeting')}</p>
          </section>

          <section className="creator-home-section">
            <h2 className="creator-home-section-title">{t('home.popularCreators')}</h2>
            {error && (
              <ErrorWidget errorText={error} onRetry={fetchCreators} />
            )}
            {!error && loading && <LoadingSpinner />}
            {!error && !loading && creators.length === 0 && (
              <EmptyWidget text={t('home.noCreators')} />
            )}
            {!error && !loading && creators.length > 0 && (
              <>
                <ul className="creator-home-creator-list" aria-label={t('home.popularCreators')}>
                  {creators.map((c) => (
                    <li key={c.id}>
                      <Link to={`/creator/creators/${c.id}`} className="creator-search-creator-card">
                        <div className="creator-search-avatar-wrap">
                          <img
                            src={c.avatarUrl || DEFAULT_AVATAR_URL}
                            alt=""
                            className="creator-search-avatar-img"
                          />
                        </div>
                        <div className="creator-search-info">
                          <span className="creator-search-name">
                            {c.displayName || c.userName || c.id}
                          </span>
                          {c.category && (
                            <span className="creator-search-category">{c.category}</span>
                          )}
                        </div>
                        {c.startingPriceCents != null && (
                          <div className="creator-search-meta">
                            <span className="creator-search-price">{priceStr(c.startingPriceCents)}</span>
                            <span className="creator-search-duration">/ {durationStr(c.sessionDurations)}</span>
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                {hasNextPage && (
                  <div ref={loadMoreRef} className="creator-home-load-more-sentinel" aria-hidden>
                    {loadingMore && <LoadingSpinner inline />}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default CreatorHome;
