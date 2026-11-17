import type { Prisma } from '@prisma/client';

// Row lock that serialises concurrent changes to one event's capacity.
export async function lockEvent(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE`;
}
