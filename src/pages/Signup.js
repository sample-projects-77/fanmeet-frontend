import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Signup.css';

// Module-level flag to prevent double submissions (persists across StrictMode remounts)
let isSubmitting = false;

const Signup = () => {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);
  const [userType, setUserType] = useState('fan'); // 'fan' or 'creator'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    category: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
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

    // Validate required fields
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (userType === 'creator' && !formData.category) {
      setError('Category is required for creators.');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for multipart/form-data
      const submitData = new FormData();
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      
      if (userType === 'creator') {
        submitData.append('category', formData.category);
      }
      
      if (avatar) {
        submitData.append('avatar', avatar);
      }

      const response = userType === 'fan' 
        ? await authAPI.registerFan(submitData)
        : await authAPI.registerCreator(submitData);
      
      // Backend returns: { StatusCode: 200, data: { user: {...}, token: "..." }, error: null }
      if (response.StatusCode === 200 && response.data && !response.error) {
        // Store token and user data
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        alert('Signup successful!');
        // TODO: Navigate to dashboard based on role
        // navigate(`/${response.data.user.role}/dashboard`);
      } else {
        setError(response.error || response.message || 'Signup failed. Please try again.');
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
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>FanMeet</h1>
          <p>Create your account to get started.</p>
        </div>

        {/* User Type Selection */}
        <div className="user-type-selector">
          <button
            type="button"
            className={`type-button ${userType === 'fan' ? 'active' : ''}`}
            onClick={() => {
              setUserType('fan');
              setFormData({ ...formData, category: '' });
            }}
          >
            Fan
          </button>
          <button
            type="button"
            className={`type-button ${userType === 'creator' ? 'active' : ''}`}
            onClick={() => setUserType('creator')}
          >
            Creator
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last name"
              />
            </div>
          </div>

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
              placeholder="Create a password"
            />
          </div>

          {userType === 'creator' && (
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                placeholder="e.g., Fitness & Personal Training"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="avatar">Profile Picture (Optional)</label>
            <input
              type="file"
              id="avatar"
              name="avatar"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
            />
            {avatar && (
              <p className="file-name">Selected: {avatar.name}</p>
            )}
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

