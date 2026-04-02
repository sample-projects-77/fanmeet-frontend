import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <Link to="/terms" className="site-footer-link">{t('footer.terms')}</Link>
      <span className="site-footer-dot">·</span>
      <Link to="/privacy" className="site-footer-link">{t('footer.privacy')}</Link>
      <span className="site-footer-dot">·</span>
      <Link to="/contact" className="site-footer-link">{t('footer.contact')}</Link>
      <span className="site-footer-dot">·</span>
      <Link to="/imprint" className="site-footer-link">{t('footer.imprint')}</Link>
    </footer>
  );
}

export default Footer;
