import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import FanSignup from './pages/FanSignup';
import CreatorSignup from './pages/CreatorSignup';
import FanDashboard from './pages/FanDashboard';
import FanSearch from './pages/FanSearch';
import FanProfile from './pages/FanProfile';
import FanProfileEdit from './pages/FanProfileEdit';
import FanChats from './pages/FanChats';
import { FanCreators, FanCreatorProfile, FanBookings, FanChatConversation } from './pages/FanPlaceholder';
import { FanProfileChangePassword, FanProfileLanguage, FanProfileBlocked } from './pages/FanProfilePlaceholder';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorOffers from './pages/CreatorOffers';
import { CreatorReviews, CreatorChatConversation } from './pages/CreatorPlaceholder';
import CreatorSearch from './pages/CreatorSearch';
import CreatorChats from './pages/CreatorChats';
import CreatorProfile from './pages/CreatorProfile';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup/fan" element={<FanSignup />} />
          <Route path="/signup/creator" element={<CreatorSignup />} />
          <Route path="/fan/home" element={<FanDashboard />} />
          <Route path="/fan/search" element={<FanSearch />} />
          <Route path="/fan/creators" element={<FanCreators />} />
          <Route path="/fan/creators/:creatorId" element={<FanCreatorProfile />} />
          <Route path="/fan/bookings" element={<FanBookings />} />
          <Route path="/fan/chats" element={<FanChats />} />
          <Route path="/fan/chats/:channelId" element={<FanChatConversation />} />
          <Route path="/fan/profile" element={<FanProfile />} />
          <Route path="/fan/profile/edit" element={<FanProfileEdit />} />
          <Route path="/fan/profile/change-password" element={<FanProfileChangePassword />} />
          <Route path="/fan/profile/language" element={<FanProfileLanguage />} />
          <Route path="/fan/profile/blocked" element={<FanProfileBlocked />} />
          <Route path="/creator/dashboard" element={<CreatorDashboard />} />
          <Route path="/creator/offers" element={<CreatorOffers />} />
          <Route path="/creator/search" element={<CreatorSearch />} />
          <Route path="/creator/chats" element={<CreatorChats />} />
          <Route path="/creator/chats/:channelId" element={<CreatorChatConversation />} />
          <Route path="/creator/profile" element={<CreatorProfile />} />
          <Route path="/creator/reviews" element={<CreatorReviews />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


