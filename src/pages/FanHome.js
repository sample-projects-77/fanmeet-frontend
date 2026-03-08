import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { profileAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import FanNav from '../components/FanNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './FanHome.css';

const ITEMS_PER_PAGE = 20;

function FanHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
      setUser(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const fetchCreators = useCallback(async (page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
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
  }, []);

  useEffect(() => {
    if (user) fetchCreators(1, false);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const displayName = user?.userName ?? t('home.fan');
  const priceStr = (cents) => (cents != null ? `${(cents / 100).toFixed(0)} €` : '');
  const minLabel = t('common.min');
  const durationStr = (durations) =>
    durations?.length ? ` / ${Math.min(...durations)} ${minLabel}` : '';

  return (
    <div className="fan-home-page">
      <FanNav active="home" user={user} onLogout={handleLogout} />
      <main className="fan-home-main">
        <div className="fan-home-container">
          <section className="fan-home-hero">
            <h1 className="fan-home-title">{t('home.title')}</h1>
            <p className="fan-home-welcome">{t('home.welcomeBack', { name: displayName })}</p>
            <p className="fan-home-greeting">{t('home.greeting')}</p>
          </section>

          <section className="fan-home-section">
            <h2 className="fan-home-section-title">{t('home.popularCreators')}</h2>
            {error && (
              <ErrorWidget errorText={error} onRetry={fetchCreators} />
            )}
            {!error && loading && <LoadingSpinner />}
            {!error && !loading && creators.length === 0 && (
              <EmptyWidget text={t('home.noCreators')} />
            )}
            {!error && !loading && creators.length > 0 && (
              <>
                <ul className="fan-home-creator-list" aria-label={t('home.popularCreators')}>
                  {creators.map((c) => (
                    <li key={c.id}>
                      <Link to={`/fan/creators/${c.id}`} className="fan-home-creator-card">
                        <div className="fan-home-creator-avatar-wrap">
                          <img
                            src={c.avatarUrl || DEFAULT_AVATAR_URL}
                            alt=""
                            className="fan-home-creator-avatar"
                          />
                        </div>
                        <div className="fan-home-creator-info">
                          <span className="fan-home-creator-name">
                            {c.displayName || c.userName || c.id}
                          </span>
                          {c.category && (
                            <span className="fan-home-creator-category">{c.category}</span>
                          )}
                        </div>
                        {(c.startingPriceCents != null || (c.sessionDurations?.length > 0)) && (
                          <div className="fan-home-creator-meta">
                            <span className="fan-home-creator-price">
                              {priceStr(c.startingPriceCents)}
                              {durationStr(c.sessionDurations)}
                            </span>
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                {hasNextPage && (
                  <div ref={loadMoreRef} className="fan-home-load-more-sentinel" aria-hidden>
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

export default FanHome;
