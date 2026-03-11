/**
 * Prefetch route data on nav hover so that when the user clicks, cache is already warm.
 * Fire-and-forget; does not update any React state.
 */

import { dashboardAPI, offerAPI } from '../services/api';
import { setCached } from './routeDataCache';

let creatorDashboardPrefetched = false;
let fanDashboardPrefetched = false;
let creatorOffersPrefetched = false;

export function prefetchCreatorDashboard() {
  if (creatorDashboardPrefetched) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  creatorDashboardPrefetched = true;
  dashboardAPI.getCreatorDashboard()
    .then((res) => {
      if (res?.StatusCode === 200 && res?.data) setCached('creatorDashboard', res.data);
    })
    .catch(() => {})
    .finally(() => { creatorDashboardPrefetched = false; });
}

export function prefetchFanDashboard() {
  if (fanDashboardPrefetched) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  fanDashboardPrefetched = true;
  dashboardAPI.getFanDashboard()
    .then((res) => {
      if (res?.StatusCode === 200 && res?.data) setCached('fanDashboard', res.data);
    })
    .catch(() => {})
    .finally(() => { fanDashboardPrefetched = false; });
}

export function prefetchCreatorOffers() {
  if (creatorOffersPrefetched) return;
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  if (!token || !userJson) return;
  let user;
  try {
    user = JSON.parse(userJson);
  } catch {
    return;
  }
  const creatorId = user?.id?.toString?.().replace(/^creator_/, '') || user?.id;
  if (!creatorId) return;
  creatorOffersPrefetched = true;
  offerAPI.getCreatorScheduledOffers(creatorId, { page: 1, itemsPerPage: 100, status: 'available' })
    .then((res) => {
      if (res?.StatusCode === 200 && res?.data) {
        setCached('creatorOffers', { offers: res.data.offers || [], pagination: res.data.pagination || null });
      }
    })
    .catch(() => {})
    .finally(() => { creatorOffersPrefetched = false; });
}
