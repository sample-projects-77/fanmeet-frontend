import { useState, useEffect, useCallback } from 'react';
import { connectAPI } from '../services/api';
import { startCreatorPayoutSetup } from '../utils/creatorPayoutSetup';

/**
 * Loads Mollie Connect / payout readiness for the logged-in creator.
 */
export function useCreatorPayoutStatus(enabled = true) {
  const [connectStatus, setConnectStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
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
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const canReceivePayments = Boolean(
    connectStatus?.canReceivePayments || connectStatus?.devBypass
  );

  return {
    connectStatus,
    loading,
    payoutLoading,
    error,
    refresh,
    setupPayout,
    canReceivePayments,
    devBypass: Boolean(connectStatus?.devBypass),
  };
}

export default useCreatorPayoutStatus;
