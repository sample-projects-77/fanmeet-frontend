import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { reviewAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import '../pages/FanCreatorReviews.css';

function formatReviewDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoString;
  }
}

function StarRating({ rating }) {
  const value = Math.min(5, Math.max(0, Number(rating) || 0));
  return (
    <span className="fan-creator-review-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= value ? (
          <StarFilled key={i} className="fan-creator-review-star-filled" />
        ) : (
          <StarOutline key={i} className="fan-creator-review-star-empty" />
        )
      )}
    </span>
  );
}

function StarFilled({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function StarOutline({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/**
 * Shared reviews list for a creator. Used by both fan and creator (viewing another creator).
 * @param {{ backTo: string }} props - backTo: URL for the back link
 */
function CreatorReviewsContent({ backTo }) {
  const { creatorId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!creatorId) return;
    setLoading(true);
    setError(null);
    try {
      const id = creatorId.toString().replace(/^creator_/, '');
      const res = await reviewAPI.getUserReviews(id, { page: 1, itemsPerPage: 50 });
      if (res.StatusCode === 200 && res.data) {
        setReviews(res.data.reviews || []);
      } else {
        setError(res.error || 'Failed to load reviews');
        setReviews([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <main className="fan-creator-reviews-main">
      <header className="fan-creator-reviews-header">
        <Link to={backTo} className="fan-creator-reviews-back" aria-label="Back to creator">
          ←
        </Link>
        <h1 className="fan-creator-reviews-title">Reviews</h1>
      </header>
      <div className="fan-creator-reviews-container">
        {error ? (
          <ErrorWidget errorText={error} onRetry={fetchReviews} />
        ) : loading ? (
          <LoadingSpinner />
        ) : reviews.length === 0 ? (
          <div className="fan-creator-reviews-empty-wrap">
            <EmptyWidget text="No reviews yet." />
          </div>
        ) : (
          <ul className="fan-creator-reviews-list">
            {reviews.map((review) => (
              <li key={review.id} className="fan-creator-review-card">
                <div className="fan-creator-review-top">
                  <div className="fan-creator-review-user">
                    <img
                      src={review.reviewer?.avatarUrl || DEFAULT_AVATAR_URL}
                      alt=""
                      className="fan-creator-review-avatar"
                    />
                    <div className="fan-creator-review-meta">
                      <p className="fan-creator-review-name">{review.reviewer?.name || 'User'}</p>
                      <p className="fan-creator-review-date">{formatReviewDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="fan-creator-review-comment">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default CreatorReviewsContent;
