import React, { useState } from 'react';
import { reviewAPI } from '../services/api';
import { ButtonLoadingSpinner } from './LoadingSpinner';
import './GiveReviewDialog.css';

function StarFilled({ className, size = 32 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width={size} height={size} aria-hidden>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function StarOutline({ className, size = 32 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size} aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function InteractiveStarRating({ rating, onRatingChanged, starCount = 5, size = 32 }) {
  return (
    <div className="give-review-stars" role="group" aria-label="Rating">
      {Array.from({ length: starCount }, (_, i) => {
        const value = i + 1;
        const filled = value <= rating;
        return (
          <button
            key={value}
            type="button"
            className="give-review-star-btn"
            onClick={() => onRatingChanged(value)}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            aria-pressed={filled}
          >
            {filled ? (
              <StarFilled className="give-review-star give-review-star--filled" size={size} />
            ) : (
              <StarOutline className="give-review-star give-review-star--outline" size={size} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function GiveReviewDialog({ bookingId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a rating.');
      return;
    }
    if (!comment.trim()) {
      setErrorMessage('Please enter a comment.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await reviewAPI.createReview(bookingId, { rating, comment: comment.trim() });
      if (res.StatusCode === 201 || res.data) {
        if (typeof onSuccess === 'function') onSuccess();
        onClose(true);
        return;
      }
      setErrorMessage(res.error || 'Something went wrong.');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong.';
      const display =
        msg === 'RATING_REQUIRED' ? 'Please select a rating.' :
        msg === 'COMMENT_REQUIRED' ? 'Please enter a comment.' :
        msg;
      setErrorMessage(display);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose(false);
  };

  return (
    <div className="give-review-dialog-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="give-review-title">
      <div className="give-review-dialog">
        <h2 id="give-review-title" className="give-review-dialog-title">Give Review</h2>

        <form onSubmit={handleSubmit} className="give-review-form">
          <label className="give-review-label">Rating</label>
          <div className="give-review-stars-wrap">
            <InteractiveStarRating rating={rating} onRatingChanged={setRating} />
          </div>

          <label className="give-review-label" htmlFor="give-review-comment">Comment</label>
          <textarea
            id="give-review-comment"
            className="give-review-textarea tns-text-field"
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            disabled={submitting}
          />

          {errorMessage && (
            <p className="give-review-error" role="alert">{errorMessage}</p>
          )}

          <div className="give-review-actions">
            <button
              type="button"
              className="btn-secondary give-review-btn give-review-btn--cancel"
              onClick={() => onClose(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary give-review-btn give-review-btn--submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ButtonLoadingSpinner />
                  <span>Submitting…</span>
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GiveReviewDialog;
