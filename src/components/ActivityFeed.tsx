import Link from "next/link";

export type PublicActivity = {
  id: string;
  actor: string;
  action: string;
  subject: string;
  href: string;
  time: number;
};

export function ActivityFeed({ activities }: { activities: PublicActivity[] }) {
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
