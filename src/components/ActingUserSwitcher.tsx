"use client";

import { setActingUserAction } from "@/actions/auth";

export function ActingUserSwitcher({
  users,
  currentId,
  loggedInAs,
}: {
  users: { id: string; username: string }[];
  currentId: string;
  loggedInAs: string;
}) {
  return (
    <form
      action={setActingUserAction}
      className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3"
    >
      <p className="text-sm text-muted">Admin editing as</p>
      <select
        name="userId"
        defaultValue={currentId}
        className="rounded-xl border border-line bg-bg px-3 py-2 text-sm"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            @{user.username}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted">Signed in as @{loggedInAs}</p>
    </form>
  );
}
