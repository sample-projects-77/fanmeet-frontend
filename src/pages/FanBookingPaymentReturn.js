import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import FanNav from '../components/FanNav';
import './FanBookingPaymentReturn.css';

/**
 * Handles return from Stripe after confirmPayment redirect.
 * Stripe adds ?payment_intent_client_secret=...&redirect_status=succeeded|failed
 */
function FanBookingPaymentReturn() {
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
              <h1 className="fan-booking-payment-return-title">Payment confirmed</h1>
              <p className="fan-booking-payment-return-text">
                Your card has been authorized. The amount will be charged when the session ends.
                You can view your booking in My Bookings.
              </p>
            </>
          )}
          {status === 'failed' && (
            <>
              <div className="fan-booking-payment-return-icon failed" aria-hidden>✕</div>
              <h1 className="fan-booking-payment-return-title">Payment failed</h1>
              <p className="fan-booking-payment-return-text">
                The payment could not be completed. Please try again from My Bookings or choose another offer.
              </p>
            </>
          )}
          {status === 'processing' && (
            <>
              <div className="fan-booking-payment-return-icon processing" aria-hidden>⋯</div>
              <h1 className="fan-booking-payment-return-title">Processing</h1>
              <p className="fan-booking-payment-return-text">
                Your payment is being processed. We’ll update your booking shortly.
              </p>
            </>
          )}
          {status === 'unknown' && (
            <>
              <h1 className="fan-booking-payment-return-title">Booking</h1>
              <p className="fan-booking-payment-return-text">
                Check the status of your booking in My Bookings.
              </p>
            </>
          )}
          <Link to="/fan/bookings" className="fan-booking-payment-return-link">
            Go to My Bookings
          </Link>
          <p className="fan-booking-payment-return-redirect">Redirecting in a few seconds…</p>
        </div>
      </main>
    </div>
  );
}

export default FanBookingPaymentReturn;
