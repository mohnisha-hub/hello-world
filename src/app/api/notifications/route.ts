import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ notifications: [], unread: 0, unreadMessages: 0 });
  const notifications = await prisma.notification.findMany({ where: { recipientId: session.user.id }, orderBy: { createdAt: "desc" }, take: 8 });
  const unread = notifications.filter((item) => !item.readAt);
  return NextResponse.json({ notifications, unread: unread.length, unreadMessages: unread.filter((item) => item.type === "message").length });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.notification.updateMany({ where: { recipientId: session.user.id, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}
