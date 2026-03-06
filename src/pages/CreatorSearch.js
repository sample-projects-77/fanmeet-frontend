import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorSearch.css';

const SEARCH_DEBOUNCE_MS = 350;

function CreatorSearch() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [creators, setCreators] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchCreators = useCallback(async (q, page = 1, append = false) => {
    setLoading(true);
    if (!append) setError(null);
    try {
      const res = await profileAPI.getCreators({
        q: q || '',
        page,
        itemsPerPage: 12,
      });
      if (res.StatusCode === 200 && res.data) {
        const list = res.data.creators || [];
        setCreators((prev) => (append ? [...prev, ...list] : list));
        setPagination(res.data.pagination || null);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user === null) return;
    const trimmed = query.trim();
    const t = setTimeout(() => {
      fetchCreators(trimmed);
    }, trimmed ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [user, query, fetchCreators]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const priceStr = (cents) =>
    cents != null ? `${(cents / 100).toFixed(0)} €` : '—';
  const durationStr = (durations) =>
    durations?.length ? `${Math.min(...durations)} Min` : '—';

  return (
    <div className="creator-search-page">
      <CreatorNav active="search" user={user} onLogout={handleLogout} />
      <main className="creator-search-main">
        <div className="creator-search-container">
          <h1 className="creator-search-title">Search</h1>
          <div className="creator-search-bar">
            <span className="creator-search-icon" aria-hidden>
              <SearchIcon />
            </span>
            <input
              type="search"
              className="creator-search-input"
              placeholder="Search"
              value={query}
              onChange={handleSearchChange}
              autoComplete="off"
              aria-label="Search creators"
            />
          </div>

          <section className="creator-search-section">
            <h2 className="creator-search-section-title">
              Popular Creators
              <span className="creator-search-flame" aria-label="Popular">🔥</span>
            </h2>
            {error ? (
              <ErrorWidget
                errorText={error}
                onRetry={() => fetchCreators(query.trim())}
              />
            ) : loading ? (
              <LoadingSpinner />
            ) : creators.length === 0 ? (
              <EmptyWidget
                text={query ? 'No creators match your search.' : 'No creators yet.'}
              />
            ) : (
              <div className="creator-search-grid">
                {creators.map((c) => (
                  <Link
                    key={c.id}
                    to={`/creator/creators/${c.id}`}
                    className="creator-search-creator-card"
                  >
                    <div className="creator-search-avatar-wrap">
                      <img
                        src={c.avatarUrl || DEFAULT_AVATAR_URL}
                        alt=""
                        className="creator-search-avatar-img"
                      />
                    </div>
                    <div className="creator-search-info">
                      <span className="creator-search-name">{c.displayName || c.id}</span>
                      {c.category && (
                        <span className="creator-search-category">{c.category}</span>
                      )}
                    </div>
                    <div className="creator-search-meta">
                      <span className="creator-search-price">{priceStr(c.startingPriceCents)}</span>
                      <span className="creator-search-duration">/ {durationStr(c.sessionDurations)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {pagination?.hasNextPage && !loading && creators.length > 0 && (
              <div className="creator-search-more">
                <button
                  type="button"
                  className="creator-search-load-more"
                  onClick={() => fetchCreators(query.trim(), pagination.currentPage + 1, true)}
                >
                  Load more
                </button>
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

export default CreatorSearch;
