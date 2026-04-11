import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CreatorNav from '../components/CreatorNav';
import CreatorOffersContent from '../components/CreatorOffersContent';
import { navTabFromLocationState } from '../utils/navTabFromLocationState';
import './CreatorOffers.css';

/**
 * Creator viewing another creator's offers — same content as fan "See offers", with creator nav and back link.
 */
function CreatorCreatorOffers() {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navTab = navTabFromLocationState(location, 'creator');
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
    <div className="creator-offers-page">
      <CreatorNav active={navTab} user={user} onLogout={handleLogout} />
      <CreatorOffersContent backTo={`/creator/creators/${creatorId}`} backState={{ navTab }} />
    </div>
  );
}

export default CreatorCreatorOffers;
