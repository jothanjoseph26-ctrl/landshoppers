import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@landshoppers/db";

import { ApiError } from "./errors.js";

const MAX_MESSAGE_CHARS = 8000;

export type AgentThreadSummary = {
  threadId: string;
  peerUserId: string;
  peerEmail: string | null;
  peerDisplayName: string | null;
  lastMessageAt: string;
  lastPreview: string;
  unreadCount: number;
};

export async function listMessageThreadsForPortal(
  prisma: PrismaClient,
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ threads: AgentThreadSummary[]; total: number }> {
  const all = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
  });

  const threadLast = new Map<string, (typeof all)[number]>();
  for (const m of all) {
    if (!threadLast.has(m.threadId)) threadLast.set(m.threadId, m);
  }
  const orderedThreadIds = [...threadLast.keys()];
  const total = orderedThreadIds.length;
  const skip = (page - 1) * pageSize;
  const pageIds = orderedThreadIds.slice(skip, skip + pageSize);

  const peerIds = pageIds.map((tid) => {
    const last = threadLast.get(tid)!;
    return last.senderId === userId ? last.receiverId : last.senderId;
  });
  const uniquePeers = [...new Set(peerIds)];
  const peers = await prisma.user.findMany({
    where: { id: { in: uniquePeers }, deletedAt: null },
    include: { profile: true },
  });
  const peerById = new Map(peers.map((u) => [u.id, u]));

  const threads: AgentThreadSummary[] = pageIds.map((threadId) => {
    const last = threadLast.get(threadId)!;
    const peerId = last.senderId === userId ? last.receiverId : last.senderId;
    const peer = peerById.get(peerId);
    const display =
      [peer?.profile?.firstName?.trim(), peer?.profile?.lastName?.trim()].filter(Boolean).join(" ").trim() || null;
    const unread = all.filter(
      (m) => m.threadId === threadId && m.receiverId === userId && !m.isRead,
    ).length;
    return {
      threadId,
      peerUserId: peerId,
      peerEmail: peer?.email ?? null,
      peerDisplayName: display,
      lastMessageAt: last.createdAt.toISOString(),
      lastPreview: last.content.length > 140 ? `${last.content.slice(0, 140)}…` : last.content,
      unreadCount: unread,
    };
  });

  return { threads, total };
}

export async function listMessagesInThreadForPortal(
  prisma: PrismaClient,
  userId: string,
  threadId: string,
  page: number,
  pageSize: number,
) {
  const participant = await prisma.message.findFirst({
    where: {
      threadId,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
  if (!participant) {
    throw new ApiError(404, "NOT_FOUND", "Thread not found");
  }

  const skip = (page - 1) * pageSize;
  const [total, rows] = await Promise.all([
    prisma.message.count({ where: { threadId } }),
    prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    messages: rows.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      isRead: m.isRead,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function sendAgentPortalMessage(
  prisma: PrismaClient,
  input: { senderId: string; threadId?: string; receiverId: string; content: string },
) {
  const content = input.content.trim();
  if (content.length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Message content is required");
  }
  if (content.length > MAX_MESSAGE_CHARS) {
    throw new ApiError(400, "VALIDATION_ERROR", `Message must be at most ${MAX_MESSAGE_CHARS} characters`);
  }
  if (input.receiverId === input.senderId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Cannot message yourself");
  }

  const receiver = await prisma.user.findFirst({
    where: { id: input.receiverId, deletedAt: null },
    select: { id: true },
  });
  if (!receiver) {
    throw new ApiError(404, "NOT_FOUND", "Recipient not found");
  }

  let threadId = input.threadId?.trim() || "";
  if (threadId.length > 0) {
    const any = await prisma.message.findFirst({ where: { threadId } });
    if (any) {
      const part = await prisma.message.findFirst({
        where: {
          threadId,
          OR: [{ senderId: input.senderId }, { receiverId: input.senderId }],
        },
      });
      if (!part) {
        throw new ApiError(403, "FORBIDDEN", "You are not a participant in this thread");
      }
      const other = part.senderId === input.senderId ? part.receiverId : part.senderId;
      if (other !== input.receiverId) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "receiverId must match the other participant in this thread",
        );
      }
    }
  } else {
    threadId = randomUUID();
  }

  const created = await prisma.message.create({
    data: {
      threadId,
      senderId: input.senderId,
      receiverId: input.receiverId,
      content,
    },
  });

  return {
    message: {
      id: created.id,
      threadId: created.threadId,
      senderId: created.senderId,
      receiverId: created.receiverId,
      content: created.content,
      isRead: created.isRead,
      readAt: created.readAt?.toISOString() ?? null,
      createdAt: created.createdAt.toISOString(),
    },
  };
}
