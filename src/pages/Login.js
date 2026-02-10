import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Login.css';

// Module-level flag to prevent double submissions (persists across StrictMode remounts)
let isSubmitting = false;

const Login = () => {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission using module-level flag (works across StrictMode remounts)
    if (isSubmitting || loading) {
      return;
    }
    
    isSubmitting = true;
    isSubmittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      // Backend returns: { StatusCode: 200, data: { user: {...}, token: "..." }, error: null }
      if (response.StatusCode === 200 && response.data && !response.error) {
        // Store token and user data
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // Redirect based on user role (for now, just show success)
        alert('Login successful!');
        // TODO: Navigate to dashboard based on role
        // navigate(`/${response.data.user.role}/dashboard`);
      } else {
        setError(response.error || response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.message || 
        'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
      // Reset module-level flag after a short delay to allow for any pending calls
      setTimeout(() => {
        isSubmitting = false;
      }, 100);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>FanMeet</h1>
          <p>Welcome back! Please login to your account.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

