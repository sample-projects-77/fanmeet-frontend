import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reviewAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import EditReviewDialog from '../components/EditReviewDialog';
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
 * @param {{ backTo: string, backState?: object }} props - backTo: URL for the back link; optional backState for nav tab
 */
function CreatorReviewsContent({ backTo, backState }) {
  const { t } = useTranslation();
  const { creatorId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loggedInUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

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

  const handleDeleteReview = useCallback(async (reviewId) => {
    if (!window.confirm(t('reviews.deleteConfirm'))) return;
    setDeletingId(reviewId);
    try {
      await reviewAPI.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
    } finally {
      setDeletingId(null);
    }
  }, [t]);

  const handleEditSuccess = useCallback(() => {
    fetchReviews();
  }, [fetchReviews]);

  const isOwnReview = (review) => {
    if (!loggedInUser?.id) return false;
    const uid = String(loggedInUser.id).replace(/^fan_/, '').replace(/^creator_/, '');
    const reviewerId = String(review.reviewer?.id || '').replace(/^fan_/, '').replace(/^creator_/, '');
    return uid === reviewerId;
  };

  return (
    <main className="fan-creator-reviews-main">
      <header className="fan-creator-reviews-header">
        <Link
          to={backTo}
          {...(backState == null ? {} : { state: backState })}
          className="fan-creator-reviews-back"
          aria-label="Back to creator"
        >
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
                {isOwnReview(review) && (
                  <div className="fan-creator-review-actions">
                    <button
                      type="button"
                      className="fan-creator-review-action-btn fan-creator-review-edit-btn"
                      onClick={() => setEditingReview(review)}
                    >
                      <EditIcon />
                      {t('reviews.editReview')}
                    </button>
                    <button
                      type="button"
                      className="fan-creator-review-action-btn fan-creator-review-delete-btn"
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={deletingId === review.id}
                    >
                      <TrashIcon />
                      {deletingId === review.id ? t('reviews.deleting') : t('reviews.deleteReview')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingReview && (
        <EditReviewDialog
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </main>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default CreatorReviewsContent;
