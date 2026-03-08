import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FanNav from '../components/FanNav';
import './FanBookingPaymentReturn.css';

/**
 * Handles return from Stripe after confirmPayment redirect.
 * Stripe adds ?payment_intent_client_secret=...&redirect_status=succeeded|failed
 */
function FanBookingPaymentReturn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);

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

  useEffect(() => {
    const redirectStatus = searchParams.get('redirect_status');
    if (redirectStatus === 'succeeded') {
      setStatus('succeeded');
    } else if (redirectStatus === 'failed' || redirectStatus === 'processing') {
      setStatus(redirectStatus);
    } else {
      setStatus('unknown');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === null) return;
    const t = setTimeout(() => {
      navigate('/fan/bookings', { replace: true });
    }, 4000);
    return () => clearTimeout(t);
  }, [status, navigate]);

  if (!user) return null;

  return (
    <div className="fan-booking-payment-return-page">
      <FanNav
        active="bookings"
        userName={user.userName}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/', { replace: true });
        }}
      />
      <main className="fan-booking-payment-return-main">
        <div className="fan-booking-payment-return-container">
          {status === 'succeeded' && (
            <>
              <div className="fan-booking-payment-return-icon success" aria-hidden>✓</div>
              <h1 className="fan-booking-payment-return-title">{t('booking.paymentConfirmed')}</h1>
              <p className="fan-booking-payment-return-text">
                {t('booking.paymentConfirmedText')}
              </p>
            </>
          )}
          {status === 'failed' && (
            <>
              <div className="fan-booking-payment-return-icon failed" aria-hidden>✕</div>
              <h1 className="fan-booking-payment-return-title">{t('booking.paymentFailed')}</h1>
              <p className="fan-booking-payment-return-text">
                {t('booking.paymentFailedText')}
              </p>
            </>
          )}
          {status === 'processing' && (
            <>
              <div className="fan-booking-payment-return-icon processing" aria-hidden>⋯</div>
              <h1 className="fan-booking-payment-return-title">{t('booking.processing')}</h1>
              <p className="fan-booking-payment-return-text">
                {t('booking.processingText')}
              </p>
            </>
          )}
          {status === 'unknown' && (
            <>
              <h1 className="fan-booking-payment-return-title">{t('booking.bookingTitle')}</h1>
              <p className="fan-booking-payment-return-text">
                {t('booking.checkStatus')}
              </p>
            </>
          )}
          <Link to="/fan/bookings" className="fan-booking-payment-return-link">
            {t('booking.goToMyBookings')}
          </Link>
          <p className="fan-booking-payment-return-redirect">{t('booking.redirecting')}</p>
        </div>
      </main>
    </div>
  );
}

export default FanBookingPaymentReturn;

