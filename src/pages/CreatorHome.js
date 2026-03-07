import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorHome.css';

const ITEMS_PER_PAGE = 20;

function CreatorHome() {
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
          setError(res.error || 'Failed to load creators');
          setCreators([]);
        }
      }
    } catch (err) {
      if (!append) {
        setError(err.response?.data?.error || err.message || 'Something went wrong');
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

  const displayName = user?.userName ?? 'Creator';
  const priceStr = (cents) => (cents != null ? `${(cents / 100).toFixed(0)} €` : '');
  const durationStr = (durations) =>
    durations?.length ? ` / ${Math.min(...durations)} Min` : '';

  return (
    <div className="creator-home-page">
      <CreatorNav active="home" user={user} onLogout={handleLogout} />
      <main className="creator-home-main">
        <div className="creator-home-container">
          <section className="creator-home-hero">
            <h1 className="creator-home-title">Fan Session</h1>
            <p className="creator-home-welcome">Welcome back, {displayName}!</p>
            <p className="creator-home-greeting">Nice to see you again 👋</p>
          </section>

          <section className="creator-home-section">
            <h2 className="creator-home-section-title">Popular Creators</h2>
            {error && (
              <ErrorWidget errorText={error} onRetry={fetchCreators} />
            )}
            {!error && loading && <LoadingSpinner />}
            {!error && !loading && creators.length === 0 && (
              <EmptyWidget text="No creators yet." />
            )}
            {!error && !loading && creators.length > 0 && (
              <>
                <ul className="creator-home-creator-list" aria-label="Popular creators">
                  {creators.map((c) => (
                    <li key={c.id}>
                      <Link to={`/creator/creators/${c.id}`} className="creator-home-creator-card">
                        <div className="creator-home-creator-avatar-wrap">
                          <img
                            src={c.avatarUrl || DEFAULT_AVATAR_URL}
                            alt=""
                            className="creator-home-creator-avatar"
                          />
                        </div>
                        <div className="creator-home-creator-info">
                          <span className="creator-home-creator-name">
                            {c.displayName || c.userName || c.id}
                          </span>
                          {c.category && (
                            <span className="creator-home-creator-category">{c.category}</span>
                          )}
                        </div>
                        {(c.startingPriceCents != null || (c.sessionDurations?.length > 0)) && (
                          <div className="creator-home-creator-meta">
                            <span className="creator-home-creator-price">
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
                  <div ref={loadMoreRef} className="creator-home-load-more-sentinel" aria-hidden>
                    {loadingMore && <LoadingSpinner />}
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
