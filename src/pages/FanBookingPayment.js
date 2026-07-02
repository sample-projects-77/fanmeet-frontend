import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { paymentAPI, bookingAPI } from '../services/api';
import FanNav from '../components/FanNav';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import { getFriendlyPaymentError } from '../utils/paymentErrors';
import './FanBookingPayment.css';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const euros = priceCents / 100;
  const value = Number.isInteger(euros)
    ? euros.toString()
    : euros.toFixed(2).replace('.', ',');
  const symbol = currency === 'EUR' ? '€' : currency;
  return `${value}${symbol}`;
}

function FanBookingPayment() {
  const { t } = useTranslation();
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const creatorId = location.state?.creatorId;
  const offersPath = creatorId
    ? `/fan/creators/${String(creatorId).replace(/^creator_/, '')}/offers`
    : null;
  const [user, setUser] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
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

  useEffect(() => {
    if (!bookingId || !user) return;

    let cancelled = false;

    async function releaseBookingOnFailure() {
      try {
        await bookingAPI.cancelBooking(bookingId, 'Payment could not be started');
      } catch {
        // Booking may already be cancelled by the backend.
      }
    }

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const configRes = await paymentAPI.getPaymentConfig();
        if (configRes.StatusCode !== 200 || configRes.data?.provider !== 'mollie') {
          if (!cancelled) {
            await releaseBookingOnFailure();
            setError(getFriendlyPaymentError(configRes.error, t) || t('booking.paymentNotConfigured'));
          }
          return;
        }

        const payRes = await paymentAPI.createPayment(bookingId);
        if (payRes.StatusCode !== 200 || !payRes.data?.checkoutUrl) {
          if (!cancelled) {
            await releaseBookingOnFailure();
            setError(getFriendlyPaymentError(payRes.error || payRes.data?.message, t) || t('booking.bookingNotFound'));
          }
          return;
        }

        if (!cancelled) {
          setPaymentData({
            checkoutUrl: payRes.data.checkoutUrl,
            amountCents: payRes.data.amountCents,
            currency: payRes.data.currency || 'EUR',
            paymentIntentStatus: payRes.data.paymentIntentStatus,
          });

          if (payRes.data.paymentIntentStatus === 'authorized' || payRes.data.paymentIntentStatus === 'paid') {
            navigate(`/fan/bookings/payment-return?bookingId=${encodeURIComponent(bookingId)}`, { replace: true });
          }
        }
      } catch (err) {
        if (!cancelled) {
          await releaseBookingOnFailure();
          setError(getFriendlyPaymentError(err.response?.data?.error || err.message, t));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [bookingId, user, navigate, t]);

  const handlePayWithMollie = () => {
    if (!paymentData?.checkoutUrl) return;
    setRedirecting(true);
    window.location.href = paymentData.checkoutUrl;
  };

  if (!user) return null;

  return (
    <div className="fan-booking-payment-page">
      <FanNav
        active="bookings"
        userName={user.userName}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/', { replace: true });
        }}
      />
      <main className="fan-booking-payment-main">
        <div className="fan-booking-payment-container">
          <header className="fan-booking-payment-header">
            <Link to="/fan/bookings" className="fan-booking-payment-back" aria-label={t('booking.goToMyBookings')}>
              {t('booking.backToBookings')}
            </Link>
            <h1 className="fan-booking-payment-title">{t('booking.completePayment')}</h1>
          </header>

          {error && (
            <div className="fan-booking-payment-error-box" role="alert">
              <p>{error}</p>
              {offersPath ? (
                <Link to={offersPath} className="fan-booking-payment-link">
                  {t('booking.backToOffers')}
                </Link>
              ) : (
                <Link to="/fan/bookings" className="fan-booking-payment-link">{t('booking.goToMyBookings')}</Link>
              )}
            </div>
          )}

          {loading && <LoadingSpinner />}

          {!loading && !error && paymentData && (
            <div className="fan-booking-payment-card">
              <p className="fan-booking-payment-summary">
                {t('booking.totalDue')}: <strong>{formatPrice(paymentData.amountCents, paymentData.currency)}</strong>
              </p>
              <p className="fan-booking-payment-note">
                {t('booking.mollieCheckoutNote')}
              </p>
              <button
                type="button"
                className="fan-booking-payment-submit"
                onClick={handlePayWithMollie}
                disabled={redirecting}
                aria-busy={redirecting}
              >
                {redirecting ? <ButtonLoadingSpinner /> : t('booking.continueToPayment')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FanBookingPayment;
