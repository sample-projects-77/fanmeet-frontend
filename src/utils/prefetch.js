/**
 * Prefetch route data so tabs load instantly (data already in cache).
 * Called when layout loads (home) and when other tabs are open.
 * Fire-and-forget; does not update any React state.
 */

import { dashboardAPI, bookingAPI, profileAPI, chatAPI, offerAPI } from '../services/api';
import { setCached, getCached } from './routeDataCache';
import { getSessionCountsFromBookings } from './sessionCounts';

let creatorDashboardPrefetched = false;
let fanDashboardPrefetched = false;
let creatorOffersPrefetched = false;
let homeCreatorsPrefetched = false;
let searchDefaultPrefetched = false;
let channelsPrefetched = false;
let creatorMyProfilePrefetched = false;

export function prefetchCreatorDashboard() {
  if (creatorDashboardPrefetched) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  creatorDashboardPrefetched = true;
  Promise.all([
    dashboardAPI.getCreatorDashboard(),
    bookingAPI.getCreatorBookings({ page: 1, itemsPerPage: 100 }),
  ])
    .then(([res, bookRes]) => {
      if (res?.StatusCode === 200 && res?.data) {
        let data = res.data;
        if (bookRes?.StatusCode === 200 && bookRes?.data?.bookings) {
          const counts = getSessionCountsFromBookings(bookRes.data.bookings);
          data = { ...data, totalSessions: counts.totalSessions, upcomingSessions: counts.upcomingSessions };
        }
        setCached('creatorDashboard', data);
      }
    })
    .catch(() => {})
    .finally(() => { creatorDashboardPrefetched = false; });
}

export function prefetchFanDashboard() {
  if (fanDashboardPrefetched) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  fanDashboardPrefetched = true;
  Promise.all([
    dashboardAPI.getFanDashboard(),
    bookingAPI.getFanBookings({ page: 1, itemsPerPage: 100 }),
  ])
    .then(([res, bookRes]) => {
      if (res?.StatusCode === 200 && res?.data) {
        let data = res.data;
        if (bookRes?.StatusCode === 200 && bookRes?.data?.bookings) {
          const counts = getSessionCountsFromBookings(bookRes.data.bookings);
          data = { ...data, totalSessions: counts.totalSessions, upcomingSessions: counts.upcomingSessions };
        }
        setCached('fanDashboard', data);
      }
    })
    .catch(() => {})
    .finally(() => { fanDashboardPrefetched = false; });
}

export function prefetchHomeCreators() {
  if (homeCreatorsPrefetched) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  homeCreatorsPrefetched = true;
  profileAPI.getCreators({ page: 1, itemsPerPage: 20 })
    .then((res) => {
      if (res?.StatusCode === 200 && res?.data) {
        setCached('homeCreators', {
          creators: res.data.creators || [],
          pagination: res.data.pagination || {},
        });
      }
    })
    .catch(() => {})
    .finally(() => { homeCreatorsPrefetched = false; });
}

export function prefetchSearchDefault() {
  if (searchDefaultPrefetched) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  searchDefaultPrefetched = true;
  profileAPI.getCreators({ page: 1, itemsPerPage: 12 })
    .then((res) => {
      if (res?.StatusCode === 200 && res?.data) {
        setCached('searchDefault', {
          creators: res.data.creators || [],
          pagination: res.data.pagination || null,
        });
      }
    })
    .catch(() => {})
    .finally(() => { searchDefaultPrefetched = false; });
}

export function prefetchChannels() {
  if (channelsPrefetched) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  channelsPrefetched = true;
  chatAPI.getIndividualChannels()
    .then((res) => {
      if (res?.StatusCode === 200 && res?.data?.channels) {
        setCached('channels', res.data.channels);
      }
    })
    .catch(() => {})
    .finally(() => { channelsPrefetched = false; });
}

export function prefetchCreatorMyProfile() {
  if (creatorMyProfilePrefetched) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  creatorMyProfilePrefetched = true;
  profileAPI.getMyProfile()
    .then((res) => {
      if (res?.StatusCode === 200 && res?.data) setCached('creatorMyProfile', res.data);
    })
    .catch(() => {})
    .finally(() => { creatorMyProfilePrefetched = false; });
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

const PRELOAD_FAN_DONE_KEY = '_preloadFanDone';
const PRELOAD_CREATOR_DONE_KEY = '_preloadCreatorDone';
const SESSION_TTL = 0; // no expiry; cleared on logout via clearAllCached()

/** Preload all data needed for Fan tabs so switching tabs does not show loaders. Runs only once per session. */
export function preloadFanData() {
  const token = localStorage.getItem('token');
  if (!token) return;
  if (getCached(PRELOAD_FAN_DONE_KEY, SESSION_TTL)) return;
  setCached(PRELOAD_FAN_DONE_KEY, true, SESSION_TTL);
  prefetchFanDashboard();
  prefetchHomeCreators();
  prefetchSearchDefault();
  prefetchChannels();
}

/** Preload all data needed for Creator tabs so switching tabs does not show loaders. Runs only once per session. */
export function preloadCreatorData() {
  const token = localStorage.getItem('token');
  if (!token) return;
  if (getCached(PRELOAD_CREATOR_DONE_KEY, SESSION_TTL)) return;
  setCached(PRELOAD_CREATOR_DONE_KEY, true, SESSION_TTL);
  prefetchCreatorDashboard();
  prefetchHomeCreators();
  prefetchSearchDefault();
  prefetchChannels();
  prefetchCreatorMyProfile();
  prefetchCreatorOffers();
}
