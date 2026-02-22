import React from 'react';
import { Link } from 'react-router-dom';
import './PlaceholderPage.css';

/**
 * Placeholder for Fan Home.
 * Will be replaced with the actual design from Flutter when provided.
 */
function FanHome() {
  return (
    <div className="placeholder-page">
      <h1>Fan Home</h1>
      <p>This screen will be built to match your Flutter design. Share the first screen when ready.</p>
      <nav>
        <Link to="/login">Login</Link>
      </nav>
    </div>
  );
}

export default FanHome;
