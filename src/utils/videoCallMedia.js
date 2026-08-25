/**
 * Helpers for reliable Stream Video mic/camera enable on mobile (esp. iOS).
 */

const STREAM_DEVICE_PREFS_KEY = '@stream-io/device-preferences';

/** iOS / Safari: prefer play-and-record so mic + speaker can run together. */
export function preparePlayAndRecordAudioSession() {
  try {
    if (typeof navigator !== 'undefined' && navigator.audioSession) {
      navigator.audioSession.type = 'play-and-record';
    }
  } catch {
    // Unsupported browsers — ignore
  }
}

/**
 * Clear persisted Stream audio device preference so a stale Bluetooth/built-in
 * deviceId (exact constraint) cannot block getUserMedia.
 */
export function clearStreamAudioDevicePreference() {
  try {
    const raw = localStorage.getItem(STREAM_DEVICE_PREFS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(STREAM_DEVICE_PREFS_KEY);
      return;
    }
    delete parsed.audioinput;
    delete parsed.microphone;
    if (parsed.devices && typeof parsed.devices === 'object') {
      delete parsed.devices.audioinput;
      delete parsed.devices.microphone;
    }
    localStorage.setItem(STREAM_DEVICE_PREFS_KEY, JSON.stringify(parsed));
  } catch {
    try {
      localStorage.removeItem(STREAM_DEVICE_PREFS_KEY);
    } catch {
      // ignore
    }
  }
}

function getAudioTracks(call) {
  const stream = call?.microphone?.state?.mediaStream;
  if (!stream || typeof stream.getAudioTracks !== 'function') return [];
  return stream.getAudioTracks();
}

/** True when Stream reports mic enabled and at least one live audio track exists. */
export function isMicrophoneLive(call) {
  const status = call?.microphone?.state?.status;
  if (status !== 'enabled') return false;
  return getAudioTracks(call).some((track) => track.readyState === 'live' && track.enabled);
}

async function trySelectDefaultMic(call) {
  if (!call?.microphone || typeof call.microphone.select !== 'function') return;
  try {
    // undefined / empty → let the browser pick the default input
    await call.microphone.select(undefined);
  } catch {
    try {
      await call.microphone.select('');
    } catch {
      // older SDK variants may not accept empty select
    }
  }
}

/**
 * Enable microphone with one recovery pass (clear stale device → disable → enable).
 * @returns {Promise<{ ok: boolean, reason?: string, error?: string }>}
 */
export async function enableMicrophoneWithRecovery(call) {
  if (!call?.microphone) {
    return { ok: false, reason: 'no_microphone', error: 'Microphone is not available' };
  }

  preparePlayAndRecordAudioSession();

  const attempt = async () => {
    await call.microphone.enable();
    // Brief settle for WebKit to attach tracks
    await new Promise((r) => setTimeout(r, 200));
    if (isMicrophoneLive(call)) return { ok: true };
    if (call.microphone.state?.status === 'enabled' && getAudioTracks(call).length > 0) {
      return { ok: true };
    }
    return { ok: false, reason: 'no_live_track' };
  };

  let firstError;
  try {
    const first = await attempt();
    if (first.ok) return first;
  } catch (err) {
    firstError = err?.message || String(err);
  }

  try {
    clearStreamAudioDevicePreference();
    await trySelectDefaultMic(call);
    try {
      await call.microphone.disable();
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 150));
    const second = await attempt();
    if (second.ok) return second;
    return {
      ok: false,
      reason: second.reason || 'enable_failed_after_retry',
      error: firstError || 'Microphone did not start',
    };
  } catch (err) {
    return {
      ok: false,
      reason: 'enable_threw',
      error: err?.message || firstError || String(err),
    };
  }
}

/**
 * Enable camera; soft-fail (does not throw). Returns whether camera is live.
 */
export async function enableCameraBestEffort(call) {
  if (!call?.camera) return false;
  try {
    await call.camera.enable();
    await new Promise((r) => setTimeout(r, 150));
    const status = call.camera.state?.status;
    const stream = call.camera.state?.mediaStream;
    const live = stream?.getVideoTracks?.().some((t) => t.readyState === 'live' && t.enabled);
    return status === 'enabled' && Boolean(live || stream);
  } catch {
    return false;
  }
}

/**
 * Enable mic + camera via Stream managers only (no parallel getUserMedia + stop).
 * Used from permission / lobby buttons under a user gesture.
 */
export async function enableLobbyMedia(microphone, camera) {
  preparePlayAndRecordAudioSession();
  const errors = [];
  if (microphone) {
    try {
      await microphone.enable();
    } catch (e) {
      errors.push(e?.message || 'Microphone permission failed');
    }
  }
  if (camera) {
    try {
      await camera.enable();
    } catch (e) {
      errors.push(e?.message || 'Camera permission failed');
    }
  }
  return { ok: errors.length === 0, errors };
}
