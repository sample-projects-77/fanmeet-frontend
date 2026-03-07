import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './CreatorEditProfile.css';

const CREATOR_CATEGORIES = [
  'Fitness & Personal Training',
  'Entertainment & Influencing',
  'Music & Performing Arts',
  'Health & Wellness',
  'Business & Consulting',
  'Education & Tutoring',
  'Art & Design',
  'Other',
];

function WorkspacePremiumIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  );
}

function PersonOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EditOutlinedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CreatorEditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState('');
  const [editingBio, setEditingBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await profileAPI.getMyProfile();
      if (res.StatusCode === 200 && res.data) {
        setProfile(res.data);
        setEditingCategory((res.data.category || '').trim());
        setEditingBio(res.data.bio || '');
      } else {
        setError(res.error || 'Failed to load profile');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
      return;
    }
    loadProfile();
  }, [navigate, loadProfile]);

  const handleEnterEdit = () => {
    setEditingCategory((profile?.category || '').trim());
    setEditingBio(profile?.bio || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingCategory.trim()) {
      setError('Please select a category.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await profileAPI.updateCreatorBioCategory({
        bio: editingBio.trim() || null,
        category: editingCategory.trim(),
      });
      if (res.StatusCode === 200 && res.data) {
        setProfile((prev) => ({
          ...prev,
          bio: res.data.bio ?? prev?.bio,
          category: res.data.category ?? prev?.category,
        }));
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const u = JSON.parse(userJson);
            if (u && res.data.category !== undefined) u.category = res.data.category;
            localStorage.setItem('user', JSON.stringify(u));
          } catch (_) {}
        }
        setIsEditing(false);
      } else {
        setError(res.error || 'Failed to save.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const category = profile?.category || null;
  const bio = profile?.bio || null;

  return (
    <div className="creator-edit-profile-page">
      <header className="creator-edit-profile-header">
        <Link to="/creator/dashboard" className="creator-edit-profile-back" aria-label="Back">
          ←
        </Link>
        <h1 className="creator-edit-profile-title">Edit Profile</h1>
      </header>

      <main className="creator-edit-profile-main">
        {loading && (
          <div className="creator-edit-profile-loading">
            <LoadingSpinner />
          </div>
        )}
        {error && !loading && (
          <div className="creator-edit-profile-error" role="alert">{error}</div>
        )}
        {!loading && profile && (
          <div className="creator-edit-profile-card">
            <div className="creator-edit-profile-row creator-edit-profile-row--head">
              <span className="creator-edit-profile-meta-icon" aria-hidden>
                <WorkspacePremiumIcon />
              </span>
              <span className="creator-edit-profile-meta-label">Category</span>
              {!isEditing && (
                <button
                  type="button"
                  className="creator-edit-profile-pill-btn"
                  onClick={handleEnterEdit}
                >
                  <EditOutlinedIcon />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <div className="creator-edit-profile-gap" />

            {isEditing ? (
              <>
                <label className="creator-edit-profile-field-label">Category</label>
                <select
                  className="creator-edit-profile-select tns-text-field"
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                  disabled={saving}
                >
                  <option value="">Select category</option>
                  {(
                    (() => {
                      const current = (profile?.category || '').trim();
                      return current && !CREATOR_CATEGORIES.includes(current)
                        ? [current, ...CREATOR_CATEGORIES]
                        : CREATOR_CATEGORIES;
                    })()
                  ).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="creator-edit-profile-gap creator-edit-profile-gap--small" />
                <label className="creator-edit-profile-field-label" htmlFor="creator-edit-bio">Bio</label>
                <textarea
                  id="creator-edit-bio"
                  className="creator-edit-profile-textarea tns-text-field"
                  placeholder="Tell fans about yourself"
                  value={editingBio}
                  onChange={(e) => setEditingBio(e.target.value)}
                  rows={4}
                  maxLength={400}
                  disabled={saving}
                />
                <div className="creator-edit-profile-actions">
                  <button
                    type="button"
                    className="btn-secondary creator-edit-profile-btn"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary creator-edit-profile-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <ButtonLoadingSpinner />
                        <span>Saving…</span>
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {category ? (
                  <span className="creator-edit-profile-pill">{category}</span>
                ) : (
                  <span className="creator-edit-profile-placeholder">Select a category</span>
                )}
                {bio != null && bio !== '' && (
                  <>
                    <div className="creator-edit-profile-gap" />
                    <div className="creator-edit-profile-row creator-edit-profile-row--head">
                      <span className="creator-edit-profile-meta-icon" aria-hidden>
                        <PersonOutlineIcon />
                      </span>
                      <span className="creator-edit-profile-meta-label">Bio</span>
                    </div>
                    <div className="creator-edit-profile-gap creator-edit-profile-gap--small" />
                    <p className="creator-edit-profile-bio-text">{bio}</p>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default CreatorEditProfile;
