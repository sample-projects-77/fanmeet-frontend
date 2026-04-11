import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { profileAPI } from '../services/api';
import { getCached, setCached } from '../utils/routeDataCache';
import { DEFAULT_AVATAR_URL } from '../constants';
import FanNav from '../components/FanNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './FanSearch.css';

const SEARCH_DEBOUNCE_MS = 350;
const CACHE_KEY = 'searchDefault';

function FanSearch({ embedded, user: userProp, onLogout: onLogoutProp }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userState, setUserState] = useState(null);
  const user = embedded ? userProp : userState;
  const handleLogout = embedded ? onLogoutProp : () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };
  const [query, setQuery] = useState('');
  const [creators, setCreators] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
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

  const fetchCreators = useCallback(async (q, page = 1, append = false, backgroundRefresh = false) => {
    if (append) {
      setLoadingMore(true);
    } else if (!backgroundRefresh) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await profileAPI.getCreators({
        q: q || '',
        page,
        itemsPerPage: 12,
      });
      if (res.StatusCode === 200 && res.data) {
        const list = res.data.creators || [];
        setCreators((prev) => (append ? [...prev, ...list] : list));
        const pag = res.data.pagination || null;
        setPagination(pag);
        if (!append && !q) setCached(CACHE_KEY, { creators: list, pagination: pag });
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

  // Initial load and when query changes (debounced)
  useEffect(() => {
    if (user === null) return;
    const trimmed = query.trim();
    if (!trimmed) {
      const cached = getCached(CACHE_KEY);
      if (cached?.creators) {
        setCreators(cached.creators);
        setPagination(cached.pagination || null);
        setLoading(false);
        setError(null);
        return;
      }
    }
    const timer = setTimeout(() => {
      fetchCreators(trimmed);
    }, trimmed ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [user, query, fetchCreators]);

  // Infinite scroll: load next page when sentinel is visible
  useEffect(() => {
    if (!pagination?.hasNextPage || loadingMore || loading) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchCreators(query.trim(), pagination.currentPage + 1, true);
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pagination?.hasNextPage, pagination?.currentPage, loadingMore, loading, query, fetchCreators]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  if (!user) return null;

  const priceStr = (cents) =>
    cents != null ? `${(cents / 100).toFixed(0)} €` : '—';
  const durationStr = (durations) =>
    durations?.length ? `${Math.min(...durations)} Min` : '—';

  return (
    <div className="fan-search-page">
      {!embedded && <FanNav active="search" user={user} onLogout={handleLogout} />}
      <main className="fan-search-main">
        <div className="fan-search-container">
          <h1 className="fan-search-title">{t('search.title')}</h1>
          <div className="fan-search-bar">
            <span className="fan-search-icon" aria-hidden>
              <SearchIcon />
            </span>
            <input
              type="search"
              className="fan-search-input"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={handleSearchChange}
              autoComplete="off"
              aria-label={t('search.searchCreators')}
            />
          </div>

          <section className="fan-search-section">
            <h2 className="fan-search-section-title">
              {t('home.popularCreators')}
              <span className="fan-search-flame" aria-label={t('search.popular')}>🔥</span>
            </h2>
            {error ? (
              <ErrorWidget
                errorText={error}
                onRetry={() => fetchCreators(query.trim())}
              />
            ) : loading ? (
              <div className="fan-search-list-loading" aria-busy="true">
                <LoadingSpinner inline />
              </div>
            ) : creators.length === 0 ? (
              <EmptyWidget
                text={query ? t('search.noMatch') : t('search.noCreators')}
              />
            ) : (
              <div className="fan-search-grid">
                {creators.map((c) => (
                  <Link
                    key={c.id}
                    to={`/fan/creators/${c.id}`}
                    state={{ navTab: 'search' }}
                    className="fan-creator-card"
                  >
                    <div className="fan-creator-avatar-wrap">
                      <img
                        src={c.avatarUrl || DEFAULT_AVATAR_URL}
                        alt=""
                        className="fan-creator-avatar-img"
                      />
                    </div>
                    <div className="fan-creator-info">
                      <span className="fan-creator-name">{c.displayName || c.id}</span>
                      {c.category && (
                        <span className="fan-creator-category">{c.category}</span>
                      )}
                    </div>
                    {c.startingPriceCents != null && (
                      <div className="fan-creator-meta">
                        <span className="fan-creator-price">{priceStr(c.startingPriceCents)}</span>
                        <span className="fan-creator-duration">/ {durationStr(c.sessionDurations)}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
            {pagination?.hasNextPage && creators.length > 0 && !loading && (
              <div ref={loadMoreRef} className="fan-search-load-more-sentinel" aria-hidden>
                {loadingMore && <LoadingSpinner inline />}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default FanSearch;
