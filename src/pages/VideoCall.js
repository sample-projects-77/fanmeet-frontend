import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  CallControls,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { videoAPI, bookingAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
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

/** Fires onBothPresent once when at least 2 participants are in the call. Must be inside StreamCall. */
function BothPresentTrigger({ onBothPresent }) {
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const hasFired = useRef(false);
  useEffect(() => {
    if (participantCount >= 2 && !hasFired.current) {
      hasFired.current = true;
      onBothPresent();
    }
  }, [participantCount, onBothPresent]);
  return null;
}

/**
 * Stream disables mic/camera when the browser permission state is "denied" (!hasBrowserPermission).
 * Show a clickable path that runs getUserMedia in a real click handler so Chrome / others can prompt again.
 */
function VideoCallBrowserPermissionBar() {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { hasBrowserPermission: micOk, microphone } = useMicrophoneState();
  const { hasBrowserPermission: camOk, camera } = useCameraState();
  const [busy, setBusy] = useState(false);

  if (micOk && camOk) return null;

  const requestAccess = async () => {
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      await microphone.enable().catch(() => {});
      await camera.enable().catch(() => {});
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Media permission retry:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="video-call-permission-bar" role="region" aria-label="Camera and microphone access">
      <p className="video-call-permission-bar-text">
        Microphone or camera is blocked in the browser. Click below to open the permission prompt again.
      </p>
      <button
        type="button"
        className="btn-primary video-call-permission-bar-btn"
        onClick={requestAccess}
        disabled={busy}
      >
        {busy ? 'Requesting…' : 'Allow microphone & camera'}
      </button>
    </div>
  );
}

function VideoCallContent({ bookingId, booking, user, onLeave, backUrl, backLabel, isFan }) {
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [joining, setJoining] = useState(true);
  const [bothPresent, setBothPresent] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const callRef = useRef(null);
  const startSessionCalled = useRef(false);
  const hasAutoEnded = useRef(false);

  const durationMinutes = booking?.durationMinutes ?? booking?.offer?.durationMinutes ?? 60;

  // Compute scheduled end time from booking so the timer reflects lateness
  const scheduledEndMs = React.useMemo(() => {
    const startIso = booking?.startTime;
    if (!startIso) return null;
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return null;
    return start.getTime() + durationMinutes * 60 * 1000;
  }, [booking?.startTime, durationMinutes]);

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
          image: user.avatarUrl || DEFAULT_AVATAR_URL,
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

        try {
          await streamCall.microphone.enable();
        } catch {
          /* User may deny; in-call bar + Stream controls can retry */
        }
        try {
          await streamCall.camera.enable();
        } catch {
          /* same */
        }

        setCall(streamCall);
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

  const onBothPresent = useCallback(() => {
    setBothPresent(true);
  }, []);

  // When both are present: call start session once, then start timer
  useEffect(() => {
    if (!bothPresent || !call || startSessionCalled.current) return;
    startSessionCalled.current = true;
    setSessionError(null);
    bookingAPI
      .startSession(bookingId)
      .then((res) => {
        if (res && res.StatusCode !== 200 && res.error) {
          setSessionError(res.error || 'Failed to start session');
        }
      })
      .catch((err) => {
        setSessionError(err.response?.data?.error || err.message || 'Failed to start session');
      });
  }, [bothPresent, call, bookingId]);

  // Timer: starts as soon as call is joined, counts down to scheduled end time
  useEffect(() => {
    if (!call || !scheduledEndMs) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((scheduledEndMs - Date.now()) / 1000));
      setRemainingSeconds(left);
      return left;
    };
    tick();
    const interval = setInterval(() => {
      if (tick() <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [call, scheduledEndMs]);

  // Auto-end when timer reaches 0: end session then leave
  useEffect(() => {
    if (remainingSeconds !== 0 || hasAutoEnded.current || !bothPresent) return;
    hasAutoEnded.current = true;
    setSessionError(null);
    bookingAPI
      .endSession(bookingId)
      .then((res) => {
        if (res && res.StatusCode !== 200 && res.error) {
          setSessionError(res.error || 'Failed to end session');
        }
      })
      .catch((err) => {
        setSessionError(err.response?.data?.error || err.message || 'Failed to end session');
      })
      .finally(() => {
        onLeave();
      });
  }, [remainingSeconds, bothPresent, bookingId, onLeave]);

  const disconnectAndNavigate = useCallback(() => {
    if (callRef.current) {
      callRef.current.leave().catch(() => {});
      callRef.current = null;
    }
    if (client) {
      client.disconnectUser().catch(() => {});
    }
    onLeave();
  }, [client, onLeave]);

  /** Creator: leave Stream only; booking stays in_progress until timer auto-end or fan ends session. */
  const handleLeave = useCallback(() => {
    disconnectAndNavigate();
  }, [disconnectAndNavigate]);

  /**
   * Fan: same as scheduled auto-end — POST endSession (complete booking + capture), then leave.
   * Guards with hasAutoEnded so we do not double-call endSession if the timer fires in the same tick.
   */
  const handleFanEndSession = useCallback(() => {
    hasAutoEnded.current = true;
    setSessionError(null);
    bookingAPI
      .endSession(bookingId)
      .then((res) => {
        if (res && res.StatusCode !== 200 && res.error) {
          setSessionError(res.error || 'Failed to end session');
        }
      })
      .catch((err) => {
        setSessionError(err.response?.data?.error || err.message || 'Failed to end session');
      })
      .finally(() => {
        disconnectAndNavigate();
      });
  }, [bookingId, disconnectAndNavigate]);

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
          <BothPresentTrigger onBothPresent={onBothPresent} />
          <StreamTheme>
            <div className="video-call-header video-call-header-in-call">
              <Link to={backUrl} className="video-call-back">← Back</Link>
              <div className="video-call-title-row">
                <h1 className="video-call-title">Video call</h1>
                {!bothPresent && (
                  <span className="video-call-waiting">Waiting for other participant…</span>
                )}
                {remainingSeconds != null && (
                  <span className="video-call-timer" aria-live="polite">
                    {formatTimeLeft(remainingSeconds)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="video-call-leave-btn btn-primary"
                onClick={isFan ? handleFanEndSession : handleLeave}
              >
                {isFan ? 'End Session' : 'Leave call'}
              </button>
            </div>
            {sessionError && (
              <div className="video-call-session-error" role="alert">
                {sessionError}
              </div>
            )}
            <div className="video-call-layout">
              <SpeakerLayout participantBarPosition="bottom" />
              <VideoCallBrowserPermissionBar />
              <CallControls onLeave={isFan ? handleFanEndSession : handleLeave} />
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
      isFan={true}
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
      isFan={false}
    />
  );
}
