import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css';

function Welcome() {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        {/* FanMeet logo */}
        <div className="app-icon">
          <img src={`${process.env.PUBLIC_URL || ''}/logo.png`} alt="FanMeet" className="app-icon-logo" />
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
