/**
 * Admin identity check. Admins are identified by email address from the
 * ADMIN_EMAILS environment variable (comma-separated). This is intentionally
 * simple — a proper role column can replace it when multi-admin management
 * is needed, but a hardcoded env var avoids a circular dependency on plan
 * assignment (admins need a way in before there's a billing hook to assign roles).
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  const raw = process.env.ADMIN_EMAILS ?? ''
  if (!raw.trim()) return false
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .includes(email.toLowerCase())
}
