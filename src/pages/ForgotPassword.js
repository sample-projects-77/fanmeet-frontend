import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { appToast } from '../utils/toast';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './AuthForm.css';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(trimmed);
      if (res.StatusCode === 200 || res.success) {
        appToast.success(t('forgotPassword.successToast'));
        navigate('/reset-code', { state: { email: trimmed } });
      } else {
        appToast.error(res.error || res.message || t('auth.errorOccurred'));
      }
    } catch (err) {
      appToast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          t('auth.errorOccurred')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page dark">
      <header className="auth-header">
        <Link to="/login" className="auth-back" aria-label={t('common.back')}>←</Link>
        <h2 className="auth-screen-title">{t('forgotPassword.screenTitle')}</h2>
      </header>
      <div className="auth-body">
        <h1 className="auth-heading">{t('forgotPassword.title')}</h1>
        <p className="auth-subtitle">{t('forgotPassword.subtitle')}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="forgot-email">
              {t('forgotPassword.emailLabel')} <span className="required">*</span>
            </label>
            <input
              type="email"
              id="forgot-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('forgotPassword.emailPlaceholder')}
              autoComplete="email"
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
            {loading ? <ButtonLoadingSpinner /> : t('forgotPassword.sendCode')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
