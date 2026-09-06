import { statusLabel } from "@/lib/visibility";

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "published"
      ? "badge-live"
      : status === "draft"
        ? "badge-draft"
        : status === "sold"
          ? "badge-sold"
          : "badge-deleted";
  return <span className={`badge ${cls}`}>{statusLabel(status)}</span>;
}
