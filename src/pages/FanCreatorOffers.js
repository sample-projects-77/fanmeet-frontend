import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FanNav from '../components/FanNav';
import CreatorOffersContent from '../components/CreatorOffersContent';
import './CreatorOffers.css';

function FanCreatorOffers() {
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
    <div className="creator-offers-page">
      <FanNav active="search" user={user} onLogout={handleLogout} />
      <CreatorOffersContent backTo={`/fan/creators/${creatorId}`} />
    </div>
  );
}

export default FanCreatorOffers;
