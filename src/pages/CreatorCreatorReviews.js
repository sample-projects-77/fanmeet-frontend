import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreatorNav from '../components/CreatorNav';
import CreatorReviewsContent from '../components/CreatorReviewsContent';
import './FanCreatorReviews.css';

/**
 * Creator viewing another creator's reviews — same content as fan "See reviews", with creator nav and back link.
 */
function CreatorCreatorReviews() {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="fan-creator-reviews-page">
      <CreatorNav active="search" user={user} onLogout={handleLogout} />
      <CreatorReviewsContent backTo={`/creator/creators/${creatorId}`} />
    </div>
  );
}

export default CreatorCreatorReviews;
