import Link from "next/link";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Atelier activity</p>
        <h1 className="mt-2 text-4xl">Buys & bids hub</h1>
        <p className="mt-2 text-muted">Review offers you have made or received, completed purchases and sales, and the chats connected to each deal.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/me/bids" className="card p-6 transition-colors hover:border-muted"><h2 className="text-2xl">Bids</h2><p className="mt-2 text-muted">Received, sent, and archived offers.</p></Link>
        <Link href="/me/buys" className="card p-6 transition-colors hover:border-muted"><h2 className="text-2xl">Buys</h2><p className="mt-2 text-muted">Items bought and sold.</p></Link>
        <Link href="/me/messages" className="card p-6 transition-colors hover:border-muted"><h2 className="text-2xl">Deal chats</h2><p className="mt-2 text-muted">Messages created by bids and purchases.</p></Link>
      </div>
    </div>
  );
}
