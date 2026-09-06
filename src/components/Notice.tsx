export function Notice({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-xl border border-line bg-paper px-4 py-3 text-sm">{message}</p>;
}
