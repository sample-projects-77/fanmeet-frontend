const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailLike(value) {
  if (!value || typeof value !== 'string') return false;
  return EMAIL_LIKE.test(value.trim());
}

/** Prefer username for public UI; never expose email addresses as a greeting. */
export function getPublicDisplayName(user, fallback = '', preferredName) {
  if (!user && preferredName == null) return fallback;
  const name = (preferredName ?? user?.userName ?? user?.name ?? '').trim();
  if (!name) return fallback;
  if (isEmailLike(name)) return fallback;
  if (user?.email && name.toLowerCase() === String(user.email).toLowerCase()) {
    return fallback;
  }
  return name;
}
