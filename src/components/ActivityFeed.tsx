import Link from "next/link";
import type { PublicActivity } from "@/lib/public-activity";

export function ActivityFeed({ activities, compact = false }: { activities: PublicActivity[]; compact?: boolean }) {
  if (compact) return <aside className="landing-activity landing-activity--compact" aria-label="Recent Atelier activity"><div className="landing-activity-heading"><div><p className="eyebrow">AROUND ATELIER</p><h2>Fresh activity.</h2></div><Link href="/">View all <span>→</span></Link></div>{activities.length ? <div className="landing-activity-compact-list">{activities.slice(0, 4).map((activity) => <Link key={activity.id} href={activity.href} className="landing-activity-card"><span className="landing-activity-avatar" aria-hidden="true">{activity.actor.slice(0, 1).toUpperCase()}</span><span><small>@{activity.actor} · {relativeTime(activity.time)}</small><strong>{activity.action} <em>{activity.subject}</em></strong></span><b>↗</b></Link>)}</div> : <p className="landing-activity-compact-empty">Activity from collectors will appear here.</p>}</aside>;
  return <section className="landing-activity" aria-label="Recent Atelier activity">
    <div className="landing-activity-heading"><div><p className="eyebrow">AROUND ATELIER</p><h2>Fresh from the community.</h2></div><Link href="/explore">Explore all <span>→</span></Link></div>
    {activities.length ? <div className="landing-activity-window"><div className="landing-activity-track">{[...activities, ...activities].map((activity, index) => <Link key={`${activity.id}-${index}`} href={activity.href} className="landing-activity-card"><span className="landing-activity-avatar" aria-hidden="true">{activity.actor.slice(0, 1).toUpperCase()}</span><span><small>@{activity.actor} · {relativeTime(activity.time)}</small><strong>{activity.action} <em>{activity.subject}</em></strong></span><b>↗</b></Link>)}</div></div> : <div className="landing-activity-empty"><span>✦</span><p>New shelves, favourites, and listings will appear here as collectors join Atelier.</p><Link href="/me/perfumes/new">Share your first perfume</Link></div>}
  </section>;
}

function relativeTime(timestamp: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
