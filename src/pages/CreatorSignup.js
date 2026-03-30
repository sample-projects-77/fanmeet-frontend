import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './AuthForm.css';

let isSubmitting = false;

function CreatorSignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState({ terms: false, age: false });

  const allConsented = consent.terms && consent.age;

  const toggleConsent = (key) => {
    setConsent((prev) => ({ ...prev, [key]: !prev[key] }));
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || loading) return;
    if (!formData.userName?.trim() || !formData.email?.trim() || !formData.password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    if (!allConsented) {
      setError(t('auth.consent.requiredCheckboxes'));
      return;
    }

    isSubmitting = true;
    setError('');
    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('email', formData.email.trim());
      submitData.append('password', formData.password);
      submitData.append('userName', formData.userName.trim());

      const response = await authAPI.registerCreator(submitData);
      if (response.StatusCode === 200 && response.data && !response.error) {
        if (response.data.token) localStorage.setItem('token', response.data.token);
        if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/creator/home', { replace: true });
      } else {
        setError(response.error || response.message || t('auth.signupFailed'));
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          t('auth.errorOccurred')
      );
    } finally {
      setLoading(false);
      setTimeout(() => { isSubmitting = false; }, 100);
    }
  };

  return (
    <div className="auth-page dark">
      <header className="auth-header">
        <Link to="/" className="auth-back" aria-label={t('common.back')}>←</Link>
        <h2 className="auth-screen-title">{t('auth.creatorSignUp')}</h2>
      </header>
      <div className="auth-body">
        <h1 className="auth-heading">{t('auth.creatorSetupHeading')}</h1>
        <p className="auth-subtitle">{t('auth.creatorSetupSubtitle')}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="userName">{t('auth.username')} <span className="required">*</span></label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
              placeholder={t('auth.usernamePlaceholder')}
              autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="email">{t('auth.email')} <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="creator@example.com"
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">{t('auth.password')} <span className="required">*</span></label>
            <div className="auth-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')} <span className="required">*</span></label>
            <div className="auth-input-wrap">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder={t('auth.confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <div className="auth-consent-group">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={consent.terms}
                onChange={() => toggleConsent('terms')}
              />
              <span className="auth-checkbox-custom" />
              <span className="auth-checkbox-text">
                <Trans
                  i18nKey="auth.consent.creatorTerms"
                  components={{
                    termsLink: <Link to="/terms/creators" className="auth-consent-link" />,
                    privacyLink: <Link to="/privacy" className="auth-consent-link" />,
                  }}
                />
              </span>
            </label>
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={consent.age}
                onChange={() => toggleConsent('age')}
              />
              <span className="auth-checkbox-custom" />
              <span className="auth-checkbox-text">{t('auth.consent.ageConfirmation')}</span>
            </label>
          </div>
          <button type="submit" className="auth-submit" disabled={loading || !allConsented} aria-busy={loading}>
            {loading ? <ButtonLoadingSpinner /> : t('auth.createAccountButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatorSignup;
