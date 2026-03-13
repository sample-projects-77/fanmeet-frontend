import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { appToast } from '../utils/toast';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './AuthForm.css';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const code = location.state?.code || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect back if missing state
  useEffect(() => {
    if (!email || !code) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, code, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (newPassword.length < 6) {
      appToast.error(t('auth.passwordMinLength'));
      return;
    }
    if (!confirmPassword) {
      appToast.error(t('resetPassword.confirmRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      appToast.error(t('resetPassword.mismatch'));
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.resetPassword(email, code, newPassword);
      if (res.StatusCode === 200 || res.success) {
        appToast.success(t('resetPassword.successToast'));
        navigate('/login', { replace: true });
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

  const EyeOpen = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );
  const EyeClosed = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  );

  if (!email || !code) return null;

  return (
    <div className="auth-page dark">
      <header className="auth-header">
        <Link to="/forgot-password" className="auth-back" aria-label={t('common.back')}>←</Link>
        <h2 className="auth-screen-title">{t('resetPassword.screenTitle')}</h2>
      </header>
      <div className="auth-body">
        <h1 className="auth-heading">{t('resetPassword.title')}</h1>
        <p className="auth-subtitle">{t('resetPassword.subtitle')}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="new-password">
              {t('resetPassword.newPasswordLabel')} <span className="required">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                type={showNew ? 'text' : 'password'}
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder={t('resetPassword.newPasswordPlaceholder')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showNew ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="confirm-password">
              {t('resetPassword.confirmPasswordLabel')} <span className="required">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showConfirm ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
            {loading ? <ButtonLoadingSpinner /> : t('resetPassword.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
