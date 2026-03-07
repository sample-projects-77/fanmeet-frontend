import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import FanSignup from './pages/FanSignup';
import CreatorSignup from './pages/CreatorSignup';
import FanHome from './pages/FanHome';
import FanDashboard from './pages/FanDashboard';
import FanSearch from './pages/FanSearch';
import FanProfile from './pages/FanProfile';
import FanProfileEdit from './pages/FanProfileEdit';
import FanChats from './pages/FanChats';
import { FanCreators } from './pages/FanPlaceholder';
import { FanAllSessions, CreatorAllSessions } from './pages/AllSessions';
import { FanSessionDetail, CreatorSessionDetail } from './pages/SessionDetail';
import { FanVideoCall, CreatorVideoCall } from './pages/VideoCall';
import { FanChatConversationWithProvider } from './components/ChatConversation';
import FanCreatorProfile from './pages/FanCreatorProfile';
import FanCreatorReviews from './pages/FanCreatorReviews';
import FanCreatorOffers from './pages/FanCreatorOffers';
import FanBookingPayment from './pages/FanBookingPayment';
import FanBookingPaymentReturn from './pages/FanBookingPaymentReturn';
import { FanProfileChangePassword, FanProfileLanguage, FanProfileBlocked } from './pages/FanProfilePlaceholder';
import CreatorHome from './pages/CreatorHome';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorOffers from './pages/CreatorOffers';
import CreatorAddTimeSlot from './pages/CreatorAddTimeSlot';
import { CreatorReviews, CreatorCreatorOffers, CreatorCreatorReviews, CreatorProfileChangePassword, CreatorProfileLanguage, CreatorProfileBlocked } from './pages/CreatorPlaceholder';
import { CreatorChatConversationWithProvider } from './components/ChatConversation';
import CreatorSearch from './pages/CreatorSearch';
import CreatorChats from './pages/CreatorChats';
import CreatorProfile from './pages/CreatorProfile';
import CreatorEditProfile from './pages/CreatorEditProfile';
import CreatorCreatorProfile from './pages/CreatorCreatorProfile';
import './App.css';

function App() {
  return (
    <Router>
      <ChatProvider>
        <div className="App">
          <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup/fan" element={<FanSignup />} />
          <Route path="/signup/creator" element={<CreatorSignup />} />
          <Route path="/fan/home" element={<FanHome />} />
          <Route path="/fan/dashboard" element={<FanDashboard />} />
          <Route path="/fan/search" element={<FanSearch />} />
          <Route path="/fan/creators" element={<FanCreators />} />
          <Route path="/fan/creators/:creatorId" element={<FanCreatorProfile />} />
          <Route path="/fan/creators/:creatorId/offers" element={<FanCreatorOffers />} />
          <Route path="/fan/creators/:creatorId/reviews" element={<FanCreatorReviews />} />
          <Route path="/fan/bookings" element={<FanAllSessions />} />
          <Route path="/fan/bookings/payment-return" element={<FanBookingPaymentReturn />} />
          <Route path="/fan/bookings/:bookingId/pay" element={<FanBookingPayment />} />
          <Route path="/fan/bookings/:bookingId" element={<FanSessionDetail />} />
          <Route path="/fan/bookings/:bookingId/call" element={<FanVideoCall />} />
          <Route path="/fan/chats" element={<FanChats />} />
          <Route path="/fan/chats/:channelId" element={<FanChatConversationWithProvider />} />
          <Route path="/fan/profile" element={<FanProfile />} />
          <Route path="/fan/profile/edit" element={<FanProfileEdit />} />
          <Route path="/fan/profile/change-password" element={<FanProfileChangePassword />} />
          <Route path="/fan/profile/language" element={<FanProfileLanguage />} />
          <Route path="/fan/profile/blocked" element={<FanProfileBlocked />} />
          <Route path="/creator/home" element={<CreatorHome />} />
          <Route path="/creator/dashboard" element={<CreatorDashboard />} />
          <Route path="/creator/offers" element={<CreatorOffers />} />
          <Route path="/creator/offers/add-time-slot" element={<CreatorAddTimeSlot />} />
          <Route path="/creator/search" element={<CreatorSearch />} />
          <Route path="/creator/creators/:creatorId" element={<CreatorCreatorProfile />} />
          <Route path="/creator/creators/:creatorId/offers" element={<CreatorCreatorOffers />} />
          <Route path="/creator/creators/:creatorId/reviews" element={<CreatorCreatorReviews />} />
          <Route path="/creator/chats" element={<CreatorChats />} />
          <Route path="/creator/chats/:channelId" element={<CreatorChatConversationWithProvider />} />
          <Route path="/creator/profile" element={<CreatorProfile />} />
          <Route path="/creator/profile/edit" element={<FanProfileEdit />} />
          <Route path="/creator/profile/edit-bio" element={<CreatorEditProfile />} />
          <Route path="/creator/profile/change-password" element={<CreatorProfileChangePassword />} />
          <Route path="/creator/profile/language" element={<CreatorProfileLanguage />} />
          <Route path="/creator/profile/blocked" element={<CreatorProfileBlocked />} />
          <Route path="/creator/reviews" element={<CreatorReviews />} />
          <Route path="/creator/bookings" element={<CreatorAllSessions />} />
          <Route path="/creator/bookings/:bookingId" element={<CreatorSessionDetail />} />
          <Route path="/creator/bookings/:bookingId/call" element={<CreatorVideoCall />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ChatProvider>
    </Router>
  );
}

export default App;


