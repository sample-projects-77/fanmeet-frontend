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
import { FanCreators, FanBookings, FanChatConversation } from './pages/FanPlaceholder';
import FanCreatorProfile from './pages/FanCreatorProfile';
import FanCreatorReviews from './pages/FanCreatorReviews';
import FanCreatorOffers from './pages/FanCreatorOffers';
import { FanProfileChangePassword, FanProfileLanguage, FanProfileBlocked } from './pages/FanProfilePlaceholder';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorOffers from './pages/CreatorOffers';
import CreatorAddTimeSlot from './pages/CreatorAddTimeSlot';
import { CreatorReviews, CreatorChatConversation, CreatorCreatorOffers, CreatorCreatorReviews, CreatorProfileChangePassword, CreatorProfileLanguage, CreatorProfileBlocked } from './pages/CreatorPlaceholder';
import CreatorSearch from './pages/CreatorSearch';
import CreatorChats from './pages/CreatorChats';
import CreatorProfile from './pages/CreatorProfile';
import CreatorCreatorProfile from './pages/CreatorCreatorProfile';
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
          <Route path="/fan/creators/:creatorId/offers" element={<FanCreatorOffers />} />
          <Route path="/fan/creators/:creatorId/reviews" element={<FanCreatorReviews />} />
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
          <Route path="/creator/offers/add-time-slot" element={<CreatorAddTimeSlot />} />
          <Route path="/creator/search" element={<CreatorSearch />} />
          <Route path="/creator/creators/:creatorId" element={<CreatorCreatorProfile />} />
          <Route path="/creator/creators/:creatorId/offers" element={<CreatorCreatorOffers />} />
          <Route path="/creator/creators/:creatorId/reviews" element={<CreatorCreatorReviews />} />
          <Route path="/creator/chats" element={<CreatorChats />} />
          <Route path="/creator/chats/:channelId" element={<CreatorChatConversation />} />
          <Route path="/creator/profile" element={<CreatorProfile />} />
          <Route path="/creator/profile/edit" element={<FanProfileEdit />} />
          <Route path="/creator/profile/change-password" element={<CreatorProfileChangePassword />} />
          <Route path="/creator/profile/language" element={<CreatorProfileLanguage />} />
          <Route path="/creator/profile/blocked" element={<CreatorProfileBlocked />} />
          <Route path="/creator/reviews" element={<CreatorReviews />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


