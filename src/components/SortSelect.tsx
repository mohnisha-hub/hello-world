"use client";

import { setFeedSortAction } from "@/actions/profile";

export function SortSelect({ feedSort }: { feedSort: string }) {
  return (
    <form action={setFeedSortAction} className="flex items-center gap-2 text-sm">
      <label>
        Organize by publish date{" "}
        <select
          name="feedSort"
          defaultValue={feedSort}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          <option value="publishedAtDesc">Newest first</option>
          <option value="publishedAtAsc">Oldest first</option>
        </select>
      </label>
    </form>
  );
}
