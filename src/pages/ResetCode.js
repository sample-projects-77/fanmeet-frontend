import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { appToast } from '../utils/toast';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './AuthForm.css';

const CODE_LENGTH = 6;

const ResetCode = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // Redirect back if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < CODE_LENGTH; i++) {
      next[i] = pasted[i] || '';
    }
    setDigits(next);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      appToast.error(t('resetCode.incompleteCode'));
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyResetCode(email, code);
      if (res.StatusCode === 200 || res.success) {
        appToast.success(t('resetCode.successToast'));
        navigate('/reset-password', { state: { email, code } });
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

  if (!email) return null;

  return (
    <div className="auth-page dark">
      <header className="auth-header">
        <Link to="/forgot-password" className="auth-back" aria-label={t('common.back')}>←</Link>
        <h2 className="auth-screen-title">{t('resetCode.screenTitle')}</h2>
      </header>
      <div className="auth-body">
        <h1 className="auth-heading">{t('resetCode.title')}</h1>
        <p className="auth-subtitle">
          {t('resetCode.subtitle')}
          <br />
          <strong>{email}</strong>
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-otp-row" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="auth-otp-input"
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                autoFocus={i === 0}
                autoComplete="one-time-code"
              />
            ))}
          </div>
          <div className="auth-otp-submit-wrap">
            <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
              {loading ? <ButtonLoadingSpinner /> : t('resetCode.next')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetCode;
