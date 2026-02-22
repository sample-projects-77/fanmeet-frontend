import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css';

function Welcome() {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        {/* App icon: gradient + connection symbol */}
        <div className="app-icon">
          <div className="app-icon-gradient">
            <svg className="app-icon-symbol" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M20 44V36c0-2 1.5-4 4-4h2c1.5 0 2.5-.5 3-1.5.5-1 .5-2.5 0-4-.5-1.5-1.5-2-3-2h-2c-2.5 0-4 2-4 4v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M44 44V36c0-2-1.5-4-4-4h-2c-1.5 0-2.5-.5-3-1.5-.5-1-.5-2.5 0-4 .5-1.5 1.5-2 3-2h2c2.5 0 4 2 4 4v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="32" cy="24" r="6" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M26 30c-4 2-6 6-6 10h24c0-4-2-8-6-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M32 38v6M29 44h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <h1 className="welcome-title">Fan Session</h1>
        <p className="welcome-tagline">Where fans and creators connect through memorable sessions.</p>
        <div className="welcome-actions">
          <Link to="/signup/fan" className="btn btn-primary">
            Sign up as Fan
          </Link>
          <Link to="/signup/creator" className="btn btn-secondary">
            Sign up as Creator
          </Link>
        </div>
        <p className="welcome-login">
          Already have an account? <Link to="/login" className="welcome-login-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Welcome;
