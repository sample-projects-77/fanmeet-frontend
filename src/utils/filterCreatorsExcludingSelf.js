/** Strip optional creator_ prefix for comparing list ids to the logged-in user id. */
export function normalizeCreatorListUserId(id) {
  if (id == null) return '';
  return String(id).replace(/^creator_/, '');
}

/**
 * Creators browsing discovery should not see their own card.
 * Fans see the full list unchanged.
 */
export function filterCreatorsExcludingSelf(creators, user) {
  if (!Array.isArray(creators) || !user) return creators || [];
  const role = String(user.role || '').toLowerCase();
  if (role !== 'creator') return creators;
  const selfId = normalizeCreatorListUserId(user.id);
  if (!selfId) return creators;
  return creators.filter((c) => normalizeCreatorListUserId(c.id) !== selfId);
}
