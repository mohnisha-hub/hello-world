export async function getSessionUser() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function getActingUser() {
  // Kept as an alias while older pages migrate to the clearer name. Never
  // substitute another user's identity in a production request.
  return getSessionUser();
}

export async function requireUser() {
  const user = await getActingUser();
  if (!user?.id) throw new Error("You need to sign in.");
  return user;
}
