import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { setAppLanguage, SUPPORTED } from '../i18n';
import { clearAllCached } from '../utils/routeDataCache';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './AuthForm.css';

let isSubmitting = false;

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    clearAllCached();
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'fan',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || loading) return;
    isSubmitting = true;
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login(formData.email, formData.password, formData.role);
      if (response.StatusCode === 200 && response.data && !response.error) {
        if (response.data.token) localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          const lang = response.data.user.language;
          if (lang && SUPPORTED.includes(lang)) setAppLanguage(lang, true);
        }
        const role = response.data.user?.role || formData.role;
        navigate(role === 'creator' ? '/creator/home' : '/fan/home', { replace: true });
      } else {
        setError(response.error || response.message || t('auth.loginFailed'));
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
        <h2 className="auth-screen-title">{t('auth.logIn')}</h2>
      </header>
      <div className="auth-body">
        <div className="auth-logo-wrap">
          <img src={`${process.env.PUBLIC_URL || ''}/logo.png`} alt="FanMeet" className="auth-logo" />
        </div>
        <h1 className="auth-heading">{t('auth.welcomeBack')}</h1>
        <p className="auth-subtitle">{t('auth.signInSubtitle')}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-role-label">{t('auth.iAm')}</label>
            <div className="auth-role-selector">
              <button
                type="button"
                className={`auth-role-btn ${formData.role === 'fan' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'fan' })}
              >
                {t('auth.fan')}
              </button>
              <button
                type="button"
                className={`auth-role-btn ${formData.role === 'creator' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'creator' })}
              >
                {t('auth.creator')}
              </button>
            </div>
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
              placeholder={t('auth.emailPlaceholder')}
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
                autoComplete="current-password"
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
          <div className="auth-forgot-password-wrap">
            <Link to="/forgot-password" className="auth-forgot-password-link">
              {t('forgotPassword.link')}
            </Link>
          </div>
          <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
            {loading ? <ButtonLoadingSpinner /> : t('auth.logIn')}
          </button>
        </form>
        <p className="auth-footer-text">
          {t('auth.dontHaveAccount')} <Link to="/" className="auth-footer-link">{t('auth.signUp')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
