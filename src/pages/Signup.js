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
    userName: '', // required by backend (unique username)
    bio: '',      // optional for creator
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

    // Validate required fields (backend: email, password, userName for both)
    if (!formData.email || !formData.password || !formData.userName) {
      setError('Please fill in email, password, and username.');
      setLoading(false);
      isSubmitting = false;
      isSubmittingRef.current = false;
      return;
    }

    try {
      // Create FormData for multipart/form-data (backend expects userName, not firstName/lastName)
      const submitData = new FormData();
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('userName', formData.userName.trim());
      if (userType === 'creator' && formData.bio) {
        submitData.append('bio', formData.bio.trim());
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
        
        const role = response.data.user?.role || userType;
        if (role === 'creator') {
          navigate('/creator/dashboard', { replace: true });
        } else {
          navigate('/fan/home', { replace: true });
        }
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
              setFormData({ ...formData, bio: '' });
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
          <div className="form-group">
            <label htmlFor="userName">Username</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
              placeholder="Unique username (e.g. johndoe)"
            />
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
              <label htmlFor="bio">Bio (optional)</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Short bio (e.g., Fitness trainer, 10 years experience)"
                rows={3}
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


