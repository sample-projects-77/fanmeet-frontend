import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  CallControls,
  SpeakerLayout,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { videoAPI, bookingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorWidget from '../components/ErrorWidget';
import './VideoCall.css';

const STREAM_API_KEY = process.env.REACT_APP_STREAM_VIDEO_API_KEY || process.env.REACT_APP_STREAM_API_KEY;

function formatTimeLeft(totalSeconds) {
  if (totalSeconds <= 0) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VideoCallContent({ bookingId, booking, user, onLeave, backUrl, backLabel }) {
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const callRef = useRef(null);

  const durationMinutes = booking?.offer?.durationMinutes ?? 60;
  const totalDurationSeconds = durationMinutes * 60;

  useEffect(() => {
    if (!bookingId || !user || !STREAM_API_KEY) return;

    let mounted = true;
    let streamClient = null;
    let streamCall = null;

    const setup = async () => {
      try {
        const tokenRes = await videoAPI.getVideoToken();
        if (!mounted) return;
        if (tokenRes.StatusCode !== 200 || !tokenRes.data?.token || !tokenRes.data?.userId) {
          setError(tokenRes.error || 'Failed to get video token');
          setJoining(false);
          return;
        }

        const { token, userId } = tokenRes.data;
        const streamUser = {
          id: userId,
          name: user.userName || user.name || 'User',
          image: user.avatarUrl || undefined,
        };

        streamClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: streamUser,
          token,
        });

        setClient(streamClient);

        const callId = String(bookingId).startsWith('booking_') ? bookingId : `booking_${bookingId}`;
        streamCall = streamClient.call('default', callId);
        callRef.current = streamCall;

        await streamCall.join({ create: true });
        if (!mounted) {
          streamCall.leave().catch(() => {});
          return;
        }
        setCall(streamCall);
        // Tell backend the meeting has started (paid → in_progress) so end session can run later
        bookingAPI.startSession(bookingId).catch(() => {});
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.error || err.message || 'Failed to join call');
        }
      } finally {
        if (mounted) setJoining(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (callRef.current) {
        callRef.current.leave().catch(() => {});
        callRef.current = null;
      }
      if (streamClient) {
        streamClient.disconnectUser().catch(() => {});
      }
    };
  }, [bookingId, user]);

  const handleLeave = useCallback(() => {
    if (callRef.current) {
      callRef.current.leave().catch(() => {});
      callRef.current = null;
    }
    if (client) {
      client.disconnectUser().catch(() => {});
    }
    // End session on backend when user leaves (so payment can be captured)
    bookingAPI.endSession(bookingId).catch(() => {});
    onLeave();
  }, [client, onLeave, bookingId]);

  // Start countdown when call is joined
  useEffect(() => {
    if (!call) return;
    setRemainingSeconds(totalDurationSeconds);
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [call, totalDurationSeconds]);

  // Auto-end meeting when timer reaches 0
  const hasAutoEnded = useRef(false);
  useEffect(() => {
    if (remainingSeconds !== 0 || hasAutoEnded.current) return;
    hasAutoEnded.current = true;
    bookingAPI.endSession(bookingId).catch(() => {});
    handleLeave();
  }, [remainingSeconds, handleLeave, bookingId]);

  if (error) {
    return (
      <div className="video-call-page">
        <div className="video-call-header">
          <Link to={backUrl} className="video-call-back">{backLabel}</Link>
          <h1 className="video-call-title">Video call</h1>
        </div>
        <div className="video-call-content">
          <ErrorWidget errorText={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  if (joining || !client || !call) {
    return (
      <div className="video-call-page">
        <div className="video-call-header">
          <Link to={backUrl} className="video-call-back">{backLabel}</Link>
          <h1 className="video-call-title">Video call</h1>
        </div>
        <div className="video-call-content video-call-loading">
          <LoadingSpinner />
          <p className="video-call-joining-text">Joining call…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-page video-call-in-call">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme>
            <div className="video-call-header video-call-header-in-call">
              <Link to={backUrl} className="video-call-back">← Back</Link>
              <div className="video-call-title-row">
                <h1 className="video-call-title">Video call</h1>
                {remainingSeconds != null && (
                  <span className="video-call-timer" aria-live="polite">
                    {formatTimeLeft(remainingSeconds)}
                  </span>
                )}
              </div>
              <button type="button" className="video-call-leave-btn btn-primary" onClick={handleLeave}>
                Leave call
              </button>
            </div>
            <div className="video-call-layout">
              <SpeakerLayout participantBarPosition="bottom" />
              <CallControls onLeave={handleLeave} />
            </div>
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}

export function FanVideoCall() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (!bookingId || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await bookingAPI.getBookingById(bookingId);
        if (cancelled) return;
        if (res.StatusCode === 200 && res.data) setBooking(res.data);
        else setError(res.error || 'Booking not found');
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message || 'Failed to load booking');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId, user]);

  const handleLeave = useCallback(() => {
    navigate(`/fan/bookings/${bookingId}`, { replace: true });
  }, [navigate, bookingId]);

  if (!user) return null;
  if (loading && !booking) return <div className="video-call-page"><LoadingSpinner /></div>;
  if (error && !booking) {
    return (
      <div className="video-call-page">
        <div className="video-call-header">
          <Link to="/fan/bookings" className="video-call-back">← Sessions</Link>
          <h1 className="video-call-title">Video call</h1>
        </div>
        <ErrorWidget errorText={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const canJoin = booking && (booking.status === 'paid' || booking.status === 'confirmed' || booking.status === 'in_progress');
  if (booking && !canJoin) {
    return (
      <div className="video-call-page">
        <div className="video-call-header">
          <Link to={`/fan/bookings/${bookingId}`} className="video-call-back">← Session</Link>
          <h1 className="video-call-title">Video call</h1>
        </div>
        <div className="video-call-content">
          <p className="video-call-cannot-join">You can only join when the session is paid.</p>
          <Link to={`/fan/bookings/${bookingId}`} className="btn-primary">Back to session</Link>
        </div>
      </div>
    );
  }

  return (
    <VideoCallContent
      bookingId={bookingId}
      booking={booking}
      user={user}
      onLeave={handleLeave}
      backUrl={`/fan/bookings/${bookingId}`}
      backLabel="← Session"
    />
  );
}

export function CreatorVideoCall() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (!bookingId || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await bookingAPI.getBookingById(bookingId);
        if (cancelled) return;
        if (res.StatusCode === 200 && res.data) setBooking(res.data);
        else setError(res.error || 'Booking not found');
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message || 'Failed to load booking');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId, user]);

  const handleLeave = useCallback(() => {
    navigate(`/creator/bookings/${bookingId}`, { replace: true });
  }, [navigate, bookingId]);

  if (!user) return null;
  if (loading && !booking) return <div className="video-call-page"><LoadingSpinner /></div>;
  if (error && !booking) {
    return (
      <div className="video-call-page">
        <div className="video-call-header">
          <Link to="/creator/bookings" className="video-call-back">← Sessions</Link>
          <h1 className="video-call-title">Video call</h1>
        </div>
        <ErrorWidget errorText={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const canJoin = booking && (booking.status === 'paid' || booking.status === 'confirmed' || booking.status === 'in_progress');
  if (booking && !canJoin) {
    return (
      <div className="video-call-page">
        <div className="video-call-header">
          <Link to={`/creator/bookings/${bookingId}`} className="video-call-back">← Session</Link>
          <h1 className="video-call-title">Video call</h1>
        </div>
        <div className="video-call-content">
          <p className="video-call-cannot-join">You can only join when the session is paid.</p>
          <Link to={`/creator/bookings/${bookingId}`} className="btn-primary">Back to session</Link>
        </div>
      </div>
    );
  }

  return (
    <VideoCallContent
      bookingId={bookingId}
      booking={booking}
      user={user}
      onLeave={handleLeave}
      backUrl={`/creator/bookings/${bookingId}`}
      backLabel="← Session"
    />
  );
}
