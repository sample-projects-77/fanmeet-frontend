import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import FanSignup from './pages/FanSignup';
import CreatorSignup from './pages/CreatorSignup';
import ForgotPassword from './pages/ForgotPassword';
import ResetCode from './pages/ResetCode';
import ResetPassword from './pages/ResetPassword';
import FanHome from './pages/FanHome';
import FanDashboard from './pages/FanDashboard';
import FanSearch from './pages/FanSearch';
import FanProfile from './pages/FanProfile';
import FanProfileEdit from './pages/FanProfileEdit';
import FanChats from './pages/FanChats';
import { FanCreators } from './pages/FanPlaceholder';
import { FanAllSessions, CreatorAllSessions } from './pages/AllSessions';
import { FanVideoCall, CreatorVideoCall } from './pages/VideoCall';
import { FanChatConversationWithProvider } from './components/ChatConversation';
import FanCreatorProfile from './pages/FanCreatorProfile';
import FanCreatorReviews from './pages/FanCreatorReviews';
import FanMyReviews from './pages/FanMyReviews';
import FanCreatorOffers from './pages/FanCreatorOffers';
import FanBookingPayment from './pages/FanBookingPayment';
import FanBookingPaymentReturn from './pages/FanBookingPaymentReturn';
import { FanProfileChangePassword, FanProfileLanguage, FanProfileBlocked } from './pages/FanProfilePlaceholder';
import CreatorHome from './pages/CreatorHome';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorOffers from './pages/CreatorOffers';
import CreatorAddTimeSlot from './pages/CreatorAddTimeSlot';
import CreatorEditTimeSlot from './pages/CreatorEditTimeSlot';
import CreatorMyReviews from './pages/CreatorMyReviews';
import CreatorCreatorOffers from './pages/CreatorCreatorOffers';
import CreatorCreatorReviews from './pages/CreatorCreatorReviews';
import { CreatorProfileChangePassword, CreatorProfileLanguage, CreatorProfileBlocked } from './pages/CreatorPlaceholder';
import { CreatorChatConversationWithProvider } from './components/ChatConversation';
import CreatorSearch from './pages/CreatorSearch';
import CreatorChats from './pages/CreatorChats';
import CreatorProfile from './pages/CreatorProfile';
import CreatorEditProfile from './pages/CreatorEditProfile';
import CreatorCreatorProfile from './pages/CreatorCreatorProfile';
import CreatorLayout from './layouts/CreatorLayout';
import FanLayout from './layouts/FanLayout';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ChatProvider>
        <div className="App">
          <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup/fan" element={<FanSignup />} />
          <Route path="/signup/creator" element={<CreatorSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-code" element={<ResetCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/fan" element={<FanLayout />}>
            <Route index element={<Navigate to="/fan/home" replace />} />
            <Route path="home" element={null} />
            <Route path="search" element={null} />
            <Route path="dashboard" element={null} />
            <Route path="chats" element={null} />
            <Route path="profile" element={null} />
            <Route path="reviews" element={<FanMyReviews />} />
            <Route path="creators" element={<FanCreators />} />
            <Route path="creators/:creatorId" element={<FanCreatorProfile />} />
            <Route path="creators/:creatorId/offers" element={<FanCreatorOffers />} />
            <Route path="creators/:creatorId/reviews" element={<FanCreatorReviews />} />
            <Route path="bookings" element={<FanAllSessions />} />
            <Route path="bookings/payment-return" element={<FanBookingPaymentReturn />} />
            <Route path="bookings/:bookingId/pay" element={<FanBookingPayment />} />
            <Route path="bookings/:bookingId" element={<Navigate to="/fan/bookings" replace />} />
            <Route path="bookings/:bookingId/call" element={<FanVideoCall />} />
            <Route path="chats/:channelId" element={<FanChatConversationWithProvider />} />
            <Route path="profile/edit" element={<FanProfileEdit />} />
            <Route path="profile/change-password" element={<FanProfileChangePassword />} />
            <Route path="profile/language" element={<FanProfileLanguage />} />
            <Route path="profile/blocked" element={<FanProfileBlocked />} />
          </Route>
          <Route path="/creator" element={<CreatorLayout />}>
            <Route index element={<Navigate to="/creator/home" replace />} />
            <Route path="home" element={null} />
            <Route path="search" element={null} />
            <Route path="dashboard" element={null} />
            <Route path="chats" element={null} />
            <Route path="profile" element={null} />
            <Route path="offers" element={<CreatorOffers />} />
            <Route path="offers/add-time-slot" element={<CreatorAddTimeSlot />} />
            <Route path="offers/edit/:offerId" element={<CreatorEditTimeSlot />} />
            <Route path="creators/:creatorId" element={<CreatorCreatorProfile />} />
            <Route path="creators/:creatorId/offers" element={<CreatorCreatorOffers />} />
            <Route path="creators/:creatorId/reviews" element={<CreatorCreatorReviews />} />
            <Route path="chats/:channelId" element={<CreatorChatConversationWithProvider />} />
            <Route path="profile/edit" element={<FanProfileEdit />} />
            <Route path="profile/edit-bio" element={<CreatorEditProfile />} />
            <Route path="profile/change-password" element={<CreatorProfileChangePassword />} />
            <Route path="profile/language" element={<CreatorProfileLanguage />} />
            <Route path="profile/blocked" element={<CreatorProfileBlocked />} />
            <Route path="reviews" element={<CreatorMyReviews />} />
            <Route path="bookings" element={<CreatorAllSessions />} />
            <Route path="bookings/:bookingId" element={<Navigate to="/creator/bookings" replace />} />
            <Route path="bookings/:bookingId/call" element={<CreatorVideoCall />} />
          </Route>
          <Route path="/signup" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ChatProvider>
    </Router>
  );
}

export default App;


