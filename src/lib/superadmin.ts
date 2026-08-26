export function isSuperadmin(email?: string | null): boolean {
  if (!email) return false
  const list = (process.env.SUPERADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return list.includes(email.toLowerCase())
}
