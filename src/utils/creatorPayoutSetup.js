import { connectAPI } from '../services/api';

/**
 * Start Mollie Connect onboarding (same flow as Profile → Setup payout).
 * @param {{ refreshStatus?: () => Promise<void>, onDevBypass?: (message?: string) => void }} [options]
 * @returns {Promise<{ redirected?: boolean, devBypass?: boolean, error?: string }>}
 */
export async function startCreatorPayoutSetup(options = {}) {
  const { refreshStatus, onDevBypass } = options;
  const res = await connectAPI.getOnboardingLink();
  const ok = res.StatusCode === 200 || res.statusCode === 200;

  if (ok && res.data?.devBypass) {
    if (refreshStatus) await refreshStatus();
    if (onDevBypass) onDevBypass(res.data.message);
    return { devBypass: true };
  }

  if (ok && res.data?.url) {
    window.location.href = res.data.url;
    return { redirected: true };
  }

  const error = res.error || 'Could not open payout setup.';
  return { error };
}
