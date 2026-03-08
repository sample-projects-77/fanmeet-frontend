import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

function InteractiveStarRating({ rating, onRatingChanged, starCount = 5, size = 32, t }) {
  return (
    <div className="give-review-stars" role="group" aria-label={t ? t('reviews.rating') : 'Rating'}>
      {Array.from({ length: starCount }, (_, i) => {
        const value = i + 1;
        const filled = value <= rating;
        const starLabel = t ? (value === 1 ? t('reviews.star') : t('reviews.stars')) : (value === 1 ? 'star' : 'stars');
        return (
          <button
            key={value}
            type="button"
            className="give-review-star-btn"
            onClick={() => onRatingChanged(value)}
            aria-label={`${value} ${starLabel}`}
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
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    if (rating < 1 || rating > 5) {
      setErrorMessage(t('reviews.selectRating'));
      return;
    }
    if (!comment.trim()) {
      setErrorMessage(t('reviews.enterComment'));
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
      setErrorMessage(res.error || t('common.errorGeneric'));
    } catch (err) {
      const msg = err.response?.data?.error || err.message || t('common.errorGeneric');
      const display =
        msg === 'RATING_REQUIRED' ? t('reviews.selectRating') :
        msg === 'COMMENT_REQUIRED' ? t('reviews.enterComment') :
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
        <h2 id="give-review-title" className="give-review-dialog-title">{t('reviews.giveReview')}</h2>

        <form onSubmit={handleSubmit} className="give-review-form">
          <label className="give-review-label">{t('reviews.rating')}</label>
          <div className="give-review-stars-wrap">
            <InteractiveStarRating rating={rating} onRatingChanged={setRating} t={t} />
          </div>

          <label className="give-review-label" htmlFor="give-review-comment">{t('reviews.comment')}</label>
          <textarea
            id="give-review-comment"
            className="give-review-textarea tns-text-field"
            placeholder={t('reviews.writeReview')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary give-review-btn give-review-btn--submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ButtonLoadingSpinner />
                  <span>{t('reviews.submitting')}</span>
                </>
              ) : (
                t('reviews.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GiveReviewDialog;
