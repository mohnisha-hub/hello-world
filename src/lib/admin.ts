export function isAdminUsername(username: string | null | undefined) {
  const admin = process.env.ADMIN_USERNAME?.trim();
  if (!admin || !username) return false;
  return username === admin;
}
