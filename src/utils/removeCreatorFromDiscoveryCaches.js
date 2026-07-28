import { getCached, setCached } from './routeDataCache';

function normCreatorId(id) {
  if (id == null) return '';
  return String(id).replace(/^creator_/, '');
}

/**
 * After blocking a creator, drop them from in-memory discovery lists so home/search
 * stay in sync without refetching the API.
 */
export function removeCreatorFromDiscoveryCaches(blockedCreatorId) {
  const blocked = normCreatorId(blockedCreatorId);
  if (!blocked) return;

  const patchKey = (key) => {
    const entry = getCached(key, 0);
    if (!entry?.creators || !Array.isArray(entry.creators)) return;
    const nextCreators = entry.creators.filter((c) => normCreatorId(c.id) !== blocked);
    if (nextCreators.length === entry.creators.length) return;
    setCached(key, { ...entry, creators: nextCreators });
  };

  patchKey('homeCreators');
  patchKey('searchDefault');
}
