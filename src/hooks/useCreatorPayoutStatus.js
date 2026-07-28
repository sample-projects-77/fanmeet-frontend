import { useState, useEffect, useCallback, useRef } from 'react';
import { connectAPI } from '../services/api';
import { startCreatorPayoutSetup } from '../utils/creatorPayoutSetup';

/**
 * Loads Mollie Connect / payout readiness for the logged-in creator.
 * Same source of truth used by Profile and Offers: GET /api/connect/status → canReceivePayments.
 */
export function useCreatorPayoutStatus(enabled = true) {
  const [connectStatus, setConnectStatus] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [hasLoaded, setHasLoaded] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) {
      setLoading(false);
      setHasLoaded(false);
      hasLoadedRef.current = false;
      setConnectStatus(null);
      return;
    }

    // Only block the UI on the first load. Background refresh must not remount forms
    // (e.g. closing the iOS keyboard fires focus and was wiping the add-slot form).
    const showLoader = !silent && !hasLoadedRef.current;
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const res = await connectAPI.getConnectStatus();
      const ok = res.StatusCode === 200 || res.statusCode === 200;
      if (ok && res.data) {
        setConnectStatus(res.data);
      } else {
        // Keep last known status so a flaky refresh doesn't flip canReceivePayments off mid-submit
        setError(res.error || 'Failed to load payout status');
        if (!hasLoadedRef.current) setConnectStatus(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load payout status');
      if (!hasLoadedRef.current) setConnectStatus(null);
    } finally {
      setLoading(false);
      setHasLoaded(true);
      hasLoadedRef.current = true;
    }
  }, [enabled]);

  useEffect(() => {
    refresh({ silent: false });
  }, [refresh]);

  // Refresh when app returns to foreground — not on every input focus (mobile keyboard).
  useEffect(() => {
    if (!enabled) return undefined;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, refresh]);

  const setupPayout = useCallback(
    async (messages = {}) => {
      if (connectStatus?.devBypass) return;
      setPayoutLoading(true);
      try {
        const result = await startCreatorPayoutSetup({
          refreshStatus: () => refresh({ silent: true }),
          onDevBypass: (message) => {
            alert(message || messages.devBypass || 'Local dev: Mollie onboarding bypassed.');
          },
        });
        if (result.error) {
          alert(messages.error || result.error);
        }
      } catch (err) {
        alert(
          err.response?.data?.error ||
            err.message ||
            messages.error ||
            'Could not open payout setup.'
        );
      } finally {
        setPayoutLoading(false);
      }
    },
    [connectStatus?.devBypass, refresh]
  );

  // Same rule as Profile label: connected only when Mollie canReceivePayments (or local bypass).
  const canReceivePayments = Boolean(
    connectStatus?.canReceivePayments || connectStatus?.devBypass
  );

  const needsReconnect = Boolean(connectStatus?.needsReconnect && !canReceivePayments);

  return {
    connectStatus,
    loading,
    hasLoaded,
    payoutLoading,
    error,
    refresh,
    setupPayout,
    canReceivePayments,
    needsReconnect,
    devBypass: Boolean(connectStatus?.devBypass),
  };
}

export default useCreatorPayoutStatus;
