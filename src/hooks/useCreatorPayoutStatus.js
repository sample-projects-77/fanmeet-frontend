import { useState, useEffect, useCallback } from 'react';
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

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setHasLoaded(false);
      setConnectStatus(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await connectAPI.getConnectStatus();
      const ok = res.StatusCode === 200 || res.statusCode === 200;
      if (ok && res.data) {
        setConnectStatus(res.data);
      } else {
        setConnectStatus(null);
        setError(res.error || 'Failed to load payout status');
      }
    } catch (err) {
      setConnectStatus(null);
      setError(err.response?.data?.error || err.message || 'Failed to load payout status');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep status fresh when returning to the tab/app (Profile stays mounted in layout).
  useEffect(() => {
    if (!enabled) return undefined;

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [enabled, refresh]);

  const setupPayout = useCallback(
    async (messages = {}) => {
      if (connectStatus?.devBypass) return;
      setPayoutLoading(true);
      try {
        const result = await startCreatorPayoutSetup({
          refreshStatus: refresh,
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

  return {
    connectStatus,
    loading,
    hasLoaded,
    payoutLoading,
    error,
    refresh,
    setupPayout,
    canReceivePayments,
    devBypass: Boolean(connectStatus?.devBypass),
  };
}

export default useCreatorPayoutStatus;
