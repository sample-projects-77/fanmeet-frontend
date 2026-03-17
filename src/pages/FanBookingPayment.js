import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentAPI } from '../services/api';
import FanNav from '../components/FanNav';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './FanBookingPayment.css';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const value = (priceCents / 100).toFixed(2).replace('.', ',');
  return `${value} ${currency}`;
}

function PaymentForm({ amountCents, currency, bookingId, onSuccess, onError }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);

  const returnUrl = `${window.location.origin}/fan/bookings/payment-return?bookingId=${encodeURIComponent(bookingId || '')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {},
          },
        },
      });
      if (error) {
        setMessage(error.message || t('booking.paymentFailedShort'));
        onError?.(error);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setMessage(err.message || t('common.errorGeneric'));
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="fan-booking-payment-form">
      <div className="fan-booking-payment-element-wrap">
        <p className="fan-booking-payment-element-label">{t('booking.cardDetails') || 'Card details'}</p>
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultCollapsed: false,
            radios: true,
            spacedAccordionItems: false,
          }}
          onChange={(event) => {
            setIsPaymentComplete(event.complete);
          }}
        />
      </div>
      {message && <div className="fan-booking-payment-error" role="alert">{message}</div>}
      <button
        type="submit"
        className="fan-booking-payment-submit"
        disabled={!stripe || !elements || isSubmitting || !isPaymentComplete}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? <ButtonLoadingSpinner /> : t('booking.pay', { amount: formatPrice(amountCents, currency) })}
      </button>
    </form>
  );
}

function FanBookingPayment() {
  const { t } = useTranslation();
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
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

  useEffect(() => {
    if (!bookingId || !user) return;

    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const keyRes = await paymentAPI.getStripePublishableKey();
        if (keyRes.StatusCode !== 200 || !keyRes.data?.publishableKey) {
          if (!cancelled) setError(keyRes.error || t('booking.stripeNotConfigured'));
          return;
        }

        const payRes = await paymentAPI.createPayment(bookingId);
        if (payRes.StatusCode !== 200 || !payRes.data?.clientSecret) {
          if (!cancelled) setError(payRes.error || t('booking.bookingNotFound'));
          return;
        }

        const stripeConnectAccountId = payRes.data.stripeConnectAccountId || null;
        const promise = loadStripe(keyRes.data.publishableKey, stripeConnectAccountId ? { stripeAccount: stripeConnectAccountId } : undefined);
        if (!cancelled) setStripePromise(promise);

        if (!cancelled) {
          setPaymentData({
            clientSecret: payRes.data.clientSecret,
            amountCents: payRes.data.amountCents,
            currency: payRes.data.currency || 'EUR',
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [bookingId, user]);

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
              <Link to="/fan/bookings" className="fan-booking-payment-link">{t('booking.goToMyBookings')}</Link>
            </div>
          )}

          {loading && <LoadingSpinner />}

          {!loading && !error && paymentData && stripePromise && (
            <div className="fan-booking-payment-card">
              <p className="fan-booking-payment-summary">
                {t('booking.totalDue')}: <strong>{formatPrice(paymentData.amountCents, paymentData.currency)}</strong>
              </p>
              <p className="fan-booking-payment-note">
                {t('booking.cardNote')}
              </p>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: paymentData.clientSecret,
                  loader: 'auto',
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#F4C046',
                      colorBackground: '#0F1115',
                      colorText: '#FFFFFF',
                      colorDanger: '#FF5C5C',
                      borderRadius: '12px',
                      fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                    },
                    rules: {
                      '.Input': {
                        backgroundColor: '#16191F',
                        border: '1px solid #2F343C',
                        boxShadow: 'none',
                      },
                      '.Label': {
                        color: '#AEB3BD',
                      },
                      '.Tab': {
                        backgroundColor: '#1C1F26',
                        borderRadius: '12px',
                      },
                      '.Tab--selected': {
                        backgroundColor: '#16191F',
                        borderColor: '#F4C046',
                        boxShadow: '0 0 0 2px rgba(244, 192, 70, 0.35)',
                      },
                    },
                  },
                }}
              >
                <PaymentForm
                  amountCents={paymentData.amountCents}
                  currency={paymentData.currency}
                  bookingId={bookingId}
                  onSuccess={() => navigate('/fan/bookings/payment-return?redirect_status=succeeded', { replace: true })}
                />
              </Elements>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FanBookingPayment;
