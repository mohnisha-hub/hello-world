import { prisma } from "@/lib/prisma";

export async function notify(recipientId: string, type: string, body: string, href: string) {
  await prisma.notification.create({ data: { recipientId, type, body, href } });
}
