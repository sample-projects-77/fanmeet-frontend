import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contactAPI } from '../services/api';
import { appToast } from '../utils/toast';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Footer from '../components/Footer';
import './Contact.css';

function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError(t('contact.validationRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError(t('contact.validationEmail'));
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await contactAPI.submit({
        name: form.name.trim(),
        subject: form.subject.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      appToast.success(t('contact.success'));
      setForm({ name: '', email: '', subject: '', message: '' });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || t('common.errorGeneric');
      setError(msg);
      appToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-language-wrapper">
        <LanguageSwitcher />
      </div>

      <Link to="/" className="contact-back">← {t('common.back')}</Link>

      <div className="contact-card">
        {/* Left: Brand panel */}
        <div className="contact-brand">
          <img
            src={`${process.env.PUBLIC_URL || ''}/logo.png`}
            alt="Fan Session"
            className="contact-brand-logo"
          />
          <h1 className="contact-brand-title">{t('contact.brandTitle')}</h1>
          <p className="contact-brand-desc">{t('contact.description')}</p>
          <p className="contact-brand-note">{t('contact.note')}</p>
        </div>

        {/* Right: Form panel */}
        <div className="contact-form-panel">
          {submitted ? (
            <div className="contact-success">
              <div className="contact-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="contact-success-text">{t('contact.success')}</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-field">
                <label htmlFor="contact-name">{t('contact.fieldName')}</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t('contact.placeholderName')}
                  autoComplete="name"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">{t('contact.fieldEmail')}</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('contact.placeholderEmail')}
                  autoComplete="email"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-subject">{t('contact.fieldSubject')}</label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder={t('contact.placeholderSubject')}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-message">{t('contact.fieldMessage')}</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder={t('contact.placeholderMessage')}
                />
              </div>

              {error && <p className="contact-error">{error}</p>}

              <button type="submit" className="contact-submit" disabled={submitting}>
                {submitting ? t('contact.submitting') : t('contact.submit')}
              </button>

              <p className="contact-helper">{t('contact.helperText')}</p>
            </form>
          )}
        </div>
      </div>

      <footer className="contact-footer">
        <Footer />
      </footer>
    </div>
  );
}

export default Contact;
