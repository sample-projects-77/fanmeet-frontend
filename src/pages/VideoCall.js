import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  CallControls,
  SpeakerLayout,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { videoAPI, bookingAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorWidget from '../components/ErrorWidget';
import {
  preparePlayAndRecordAudioSession,
  enableMicrophoneWithRecovery,
  enableCameraBestEffort,
  enableLobbyMedia,
  isMicrophoneLive,
} from '../utils/videoCallMedia';
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

/** Shown in-call when local mic/camera are off so users know why the other side cannot hear/see them. */
function VideoCallMediaOffReminder() {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { isEnabled: micOn } = useMicrophoneState();
  const { isEnabled: camOn } = useCameraState();

  if (micOn && camOn) return null;

  const parts = [];
  if (!micOn) parts.push('microphone');
  if (!camOn) parts.push('camera');

  return (
    <div className="video-call-media-off-bar" role="status">
      <p className="video-call-media-off-bar-text">
        Your {parts.join(' and ')} {parts.length > 1 ? 'are' : 'is'} off. Use the controls below so the other
        participant can see and hear you.
      </p>
    </div>
  );
}

/**
 * Stream disables mic/camera when the browser permission state is "denied".
 * Re-enable via Stream managers under a real click (no getUserMedia+stop).
 */
function VideoCallBrowserPermissionBar() {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { hasBrowserPermission: micOk, microphone } = useMicrophoneState();
  const { hasBrowserPermission: camOk, camera } = useCameraState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (micOk && camOk) return null;

  const requestAccess = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await enableLobbyMedia(microphone, camera);
      if (!result.ok) {
        setError(
          result.errors?.[0] ||
            'Permission was blocked. Allow microphone & camera in browser settings, or open this page in Safari/Chrome.'
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Media permission retry:', e);
      setError(e?.message || 'Could not request microphone and camera access');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="video-call-permission-bar" role="region" aria-label="Camera and microphone access">
      <p className="video-call-permission-bar-text">
        Microphone or camera is blocked in the browser. Click below to open the permission prompt again.
      </p>
      {error ? (
        <p className="video-call-permission-bar-error" role="alert">
          {error}
        </p>
      ) : null}
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

/** Live mic level in the lobby so users know capture works before joining (Zoom-like). */
function LobbyMicMeter() {
  const { useMicrophoneState } = useCallStateHooks();
  const { mediaStream, isEnabled } = useMicrophoneState();
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!isEnabled || !mediaStream) {
      setLevel(0);
      return undefined;
    }

    let raf = 0;
    let audioCtx = null;
    let source = null;
    let cancelled = false;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return undefined;
      audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (cancelled) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) sum += data[i];
        setLevel(Math.min(1, sum / (data.length * 60)));
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      return undefined;
    }

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      try {
        source?.disconnect();
      } catch {
        /* ignore */
      }
      audioCtx?.close?.().catch(() => {});
    };
  }, [isEnabled, mediaStream]);

  if (!isEnabled) {
    return (
      <p className="video-call-lobby-mic-hint">
        Turn on your microphone above, then speak — the meter should move before you join.
      </p>
    );
  }

  const hearing = level > 0.04;
  return (
    <div className="video-call-lobby-mic-meter" aria-live="polite">
      <div className="video-call-lobby-mic-meter-track">
        <div
          className={`video-call-lobby-mic-meter-fill${hearing ? ' is-hot' : ''}`}
          style={{ width: `${Math.max(4, Math.round(level * 100))}%` }}
        />
      </div>
      <span className="video-call-lobby-mic-meter-label">
        {hearing ? 'We can hear you — good to join' : 'Speak to test your microphone'}
      </span>
    </div>
  );
}

/** Live camera preview in the pre-join lobby. */
function LobbyVideoPreview() {
  const { useCameraState } = useCallStateHooks();
  const { mediaStream, isEnabled, hasBrowserPermission, camera } = useCameraState();
  const videoRef = useRef(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !mediaStream) {
      if (el) el.srcObject = null;
      return;
    }
    el.srcObject = mediaStream;
    el.play().catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('Lobby preview play:', e);
    });
    return () => {
      el.pause();
      el.srcObject = null;
    };
  }, [mediaStream]);

  const startPreview = async () => {
    setStarting(true);
    try {
      await camera.enable();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Start camera preview:', e);
    } finally {
      setStarting(false);
    }
  };

  if (!hasBrowserPermission) {
    return (
      <div className="video-call-lobby-preview-placeholder">
        Allow camera access below to see your preview.
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <button
        type="button"
        className="video-call-lobby-preview-start"
        onClick={startPreview}
        disabled={starting}
      >
        {starting ? 'Starting camera…' : 'Start camera preview'}
      </button>
    );
  }

  if (!mediaStream) {
    return (
      <div className="video-call-lobby-preview-placeholder">
        Starting camera…
      </div>
    );
  }

  return (
    <div className="video-call-lobby-preview-mirror">
      <video
        ref={videoRef}
        className="video-call-lobby-preview-video"
        autoPlay
        playsInline
        muted
      />
    </div>
  );
}

/**
 * Pre-join lobby: mic/camera must be toggled or enabled from a user click on mobile browsers.
 * Auto-enabling media in useEffect is blocked on iOS Safari and many Android WebViews.
 */
function VideoCallLobby({ onJoin, joiningCall, joinError, backUrl, backLabel }) {
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { hasBrowserPermission: micOk, microphone, isEnabled: micOn } = useMicrophoneState();
  const { hasBrowserPermission: camOk, camera } = useCameraState();
  const [busy, setBusy] = useState(false);
  const [accessError, setAccessError] = useState('');

  const requestAccess = async () => {
    setBusy(true);
    setAccessError('');
    try {
      const result = await enableLobbyMedia(microphone, camera);
      if (!result.ok) {
        setAccessError(
          result.errors?.[0] ||
            'Could not enable microphone/camera. Allow access when prompted, or open in Safari/Chrome.'
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Media permission request:', e);
      setAccessError(e?.message || 'Could not request microphone and camera access');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="video-call-lobby">
      <div className="video-call-header">
        <Link to={backUrl} className="video-call-back">{backLabel}</Link>
        <h1 className="video-call-title">Video call</h1>
      </div>
      <div className="video-call-lobby-body">
        <p className="video-call-lobby-lead">
          Check your camera and microphone, then join the meeting. Speak and confirm the mic meter moves
          before you join.
        </p>
        <div className="video-call-lobby-preview">
          <LobbyVideoPreview />
        </div>
        <div className="video-call-lobby-device-row">
          <ToggleAudioPreviewButton caption="Mic" />
          <ToggleVideoPreviewButton caption="Camera" />
        </div>
        <LobbyMicMeter />
        {(!micOk || !camOk) && (
          <div className="video-call-permission-bar video-call-lobby-permission">
            <p className="video-call-permission-bar-text">
              Allow camera and microphone when your browser asks. If you previously blocked access, use the button
              below or open this page in Safari or Chrome (not an in-app browser such as WhatsApp).
            </p>
            {accessError ? (
              <p className="video-call-permission-bar-error" role="alert">
                {accessError}
              </p>
            ) : null}
            <button
              type="button"
              className="btn-primary video-call-permission-bar-btn"
              onClick={requestAccess}
              disabled={busy}
            >
              {busy ? 'Requesting…' : 'Allow microphone & camera'}
            </button>
          </div>
        )}
        {joinError && (
          <div className="video-call-session-error" role="alert">
            {joinError}
          </div>
        )}
        <button
          type="button"
          className="btn-primary video-call-lobby-join"
          onClick={onJoin}
          disabled={joiningCall}
        >
          {joiningCall ? 'Starting microphone…' : micOn ? 'Join meeting' : 'Enable mic & join'}
        </button>
        <p className="video-call-lobby-tip">
          Tip: For the best experience on mobile, open fan-session.com in Safari or Chrome instead of an in-app browser.
          Built-in mic should work without AirPods.
        </p>
      </div>
    </div>
  );
}

function VideoCallContent({ bookingId, booking, user, onLeave, backUrl, backLabel, isFan }) {
  const { t } = useTranslation();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [joining, setJoining] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [joiningCall, setJoiningCall] = useState(false);
  const [joinError, setJoinError] = useState(null);
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

  const handleJoinMeeting = useCallback(async () => {
    const streamCall = callRef.current;
    if (!streamCall || joiningCall) return;

    setJoiningCall(true);
    setJoinError(null);

    try {
      // User gesture context — required on mobile for getUserMedia / publish tracks.
      preparePlayAndRecordAudioSession();

      const micResult = await enableMicrophoneWithRecovery(streamCall);
      if (!micResult.ok) {
        setJoinError(
          micResult.error ||
            'Microphone did not start. Allow microphone access, then try again. Prefer Safari or Chrome (not WhatsApp’s in-app browser).'
        );
        return;
      }

      if (!isMicrophoneLive(streamCall)) {
        // Final guard — do not join while muted/silent after a false-positive enable
        setJoinError(
          'Microphone is not capturing audio yet. Toggle Mic on, speak to test the meter, then try Join again.'
        );
        return;
      }

      const cameraOk = await enableCameraBestEffort(streamCall);
      if (!cameraOk) {
        // Camera is optional for join; warn but continue so audio sessions still work
        // eslint-disable-next-line no-console
        console.warn('Camera did not start; joining with microphone only');
      }

      await streamCall.join({ create: true });
      setInCall(true);
      bookingAPI.reportParticipation(bookingId).catch(() => {});
    } catch (err) {
      setJoinError(err.response?.data?.error || err.message || 'Failed to join call');
    } finally {
      setJoiningCall(false);
    }
  }, [joiningCall, bookingId]);

  const onBothPresent = useCallback(() => {
    setBothPresent(true);
  }, []);

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

  const finalizeNoShowAndLeave = useCallback(() => {
    hasAutoEnded.current = true;
    setSessionError(null);
    return bookingAPI
      .finalizeNoShow(bookingId)
      .then((res) => {
        if (res && res.StatusCode !== 200 && res.error) {
          setSessionError(res.error || t('videoCall.noShowFailed'));
        }
      })
      .catch((err) => {
        setSessionError(err.response?.data?.error || err.message || t('videoCall.noShowFailed'));
      })
      .finally(() => {
        disconnectAndNavigate();
      });
  }, [bookingId, disconnectAndNavigate, t]);

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

  // Auto-end when timer reaches 0: capture if both present, otherwise finalize no-show
  useEffect(() => {
    if (remainingSeconds !== 0 || hasAutoEnded.current || !inCall) return;
    hasAutoEnded.current = true;
    setSessionError(null);
    if (bothPresent) {
      bookingAPI
        .endSession(bookingId)
        .then((res) => {
          if (res && res.StatusCode !== 200 && res.error) {
            setSessionError(res.error || t('videoCall.endSessionFailed'));
          }
        })
        .catch((err) => {
          setSessionError(err.response?.data?.error || err.message || t('videoCall.endSessionFailed'));
        })
        .finally(() => {
          disconnectAndNavigate();
        });
    } else {
      finalizeNoShowAndLeave();
    }
  }, [remainingSeconds, bothPresent, inCall, bookingId, disconnectAndNavigate, finalizeNoShowAndLeave, t]);

  /** Creator: leave Stream only; booking stays in_progress until timer auto-end or fan ends session. */
  const handleLeave = useCallback(() => {
    disconnectAndNavigate();
  }, [disconnectAndNavigate]);

  /**
   * Fan: endSession when both joined; finalize no-show when alone (no capture).
   */
  const handleFanEndSession = useCallback(() => {
    if (hasAutoEnded.current) return;
    if (!bothPresent) {
      finalizeNoShowAndLeave();
      return;
    }
    hasAutoEnded.current = true;
    setSessionError(null);
    bookingAPI
      .endSession(bookingId)
      .then((res) => {
        if (res && res.StatusCode !== 200 && res.error) {
          setSessionError(res.error || t('videoCall.endSessionFailed'));
        }
      })
      .catch((err) => {
        setSessionError(err.response?.data?.error || err.message || t('videoCall.endSessionFailed'));
      })
      .finally(() => {
        disconnectAndNavigate();
      });
  }, [bookingId, bothPresent, disconnectAndNavigate, finalizeNoShowAndLeave, t]);

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
          <p className="video-call-joining-text">Loading call…</p>
        </div>
      </div>
    );
  }

  if (!inCall) {
    return (
      <div className="video-call-page">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <StreamTheme>
              <VideoCallLobby
                onJoin={handleJoinMeeting}
                joiningCall={joiningCall}
                joinError={joinError}
                backUrl={backUrl}
                backLabel={backLabel}
              />
            </StreamTheme>
          </StreamCall>
        </StreamVideo>
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
              <div className="video-call-header-top">
                <Link to={backUrl} className="video-call-back">
                  ← {t('common.back')}
                </Link>
                <button
                  type="button"
                  className="video-call-leave-btn btn-primary"
                  onClick={isFan ? handleFanEndSession : handleLeave}
                >
                  {isFan ? t('videoCall.endSession') : t('videoCall.leaveCall')}
                </button>
              </div>
              <div className="video-call-header-meta">
                <h1 className="video-call-title">{t('videoCall.title')}</h1>
                {remainingSeconds != null && (
                  <span className="video-call-timer" aria-live="polite">
                    {formatTimeLeft(remainingSeconds)}
                  </span>
                )}
              </div>
              {!bothPresent && (
                <span className="video-call-waiting video-call-waiting--header">
                  {t('videoCall.waitingForOther')}
                </span>
              )}
            </div>
            {sessionError && (
              <div className="video-call-session-error" role="alert">
                {sessionError}
              </div>
            )}
            {!bothPresent && inCall && (
              <div className="video-call-no-charge-notice" role="status">
                {t('videoCall.waitingAlone')}
              </div>
            )}
            <div className="video-call-layout">
              <SpeakerLayout participantBarPosition="bottom" />
              <VideoCallMediaOffReminder />
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
