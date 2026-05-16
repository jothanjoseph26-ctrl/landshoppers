"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  fetchAgentMessageThreads,
  fetchAgentThreadMessages,
  sendAgentPortalMessage,
} from "@/lib/api/agent-portal"
import { usePortalData } from "@/lib/api/use-portal-data"
import { formatRelativeTime } from "@/lib/format"

function AgentMessagesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const threadFromUrl = searchParams.get("thread")

  const threads = usePortalData("agent:messages:threads", () =>
    fetchAgentMessageThreads({ page: 1, pageSize: 50 }),
  )

  const selectedThreadId = threadFromUrl ?? threads.data?.data[0]?.threadId ?? null

  const messages = usePortalData(
    selectedThreadId ? `agent:messages:thread:${selectedThreadId}` : null,
    () => fetchAgentThreadMessages(selectedThreadId!, { page: 1, pageSize: 100 }),
  )

  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  const activeSummary = useMemo(
    () => threads.data?.data.find((t) => t.threadId === selectedThreadId),
    [threads.data, selectedThreadId],
  )

  const selectThread = useCallback(
    (threadId: string) => {
      router.replace(`/agent/messages?thread=${encodeURIComponent(threadId)}`, { scroll: false })
    },
    [router],
  )

  const sendReply = async () => {
    const text = draft.trim()
    if (!text || !selectedThreadId || !activeSummary) return
    setSending(true)
    try {
      await sendAgentPortalMessage({
        threadId: selectedThreadId,
        receiverId: activeSummary.peerUserId,
        content: text,
      })
      setDraft("")
      toast.success("Message sent")
      void threads.refresh()
      void messages.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed")
    } finally {
      setSending(false)
    }
  }

  if (threads.isUnauthenticated) return <PortalAuthRequired />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Messages</h1>
        <p className="text-muted-foreground">
          Direct messages with buyers and colleagues. Real-time delivery is planned; this inbox uses the REST API.
        </p>
      </div>

      {threads.error && !threads.isForbidden && (
        <PortalError
          title="Couldn't load threads"
          description="The API returned an error. Please retry."
          onRetry={threads.refresh}
        />
      )}

      {threads.isLoading && <PortalLoading label="Loading conversations…" />}

      {threads.data && threads.data.data.length === 0 && (
        <PortalEmpty
          title="No conversations yet"
          description="When someone messages you from a lead or contact flow, threads will appear here."
          primaryHref="/agent/leads"
          primaryLabel="Open leads"
        />
      )}

      {threads.data && threads.data.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
          <Card className="md:max-h-[70vh] md:overflow-y-auto">
            <CardContent className="p-2">
              <ul className="space-y-1">
                {threads.data.data.map((t) => {
                  const active = t.threadId === selectedThreadId
                  return (
                    <li key={t.threadId}>
                      <button
                        type="button"
                        onClick={() => selectThread(t.threadId)}
                        className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          active ? "bg-muted font-medium" : "hover:bg-muted/60"
                        }`}
                      >
                        <span className="truncate">
                          {t.peerDisplayName ?? t.peerEmail ?? "Conversation"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">{t.lastPreview}</span>
                        <span className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatRelativeTime(t.lastMessageAt)}</span>
                          {t.unreadCount > 0 ? (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                              {t.unreadCount}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          <Card className="flex min-h-[320px] flex-col">
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
              {!selectedThreadId && <p className="text-sm text-muted-foreground">Select a conversation.</p>}

              {selectedThreadId && messages.error && !messages.isForbidden && (
                <PortalError title="Couldn't load messages" onRetry={messages.refresh} />
              )}

              {selectedThreadId && messages.isLoading && <PortalLoading label="Loading messages…" />}

              {selectedThreadId && messages.data && (
                <>
                  <div className="text-sm text-muted-foreground">
                    With{" "}
                    <span className="font-medium text-foreground">
                      {activeSummary?.peerDisplayName ?? activeSummary?.peerEmail ?? "participant"}
                    </span>
                    {activeSummary?.peerEmail && activeSummary.peerDisplayName ? (
                      <span className="block truncate text-xs">{activeSummary.peerEmail}</span>
                    ) : null}
                  </div>
                  <div className="flex max-h-[360px] flex-1 flex-col gap-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
                    {messages.data.data.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages in this thread.</p>
                    ) : (
                      messages.data.data.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
                        >
                          <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
                            <span>{formatRelativeTime(m.createdAt)}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <Textarea
                      placeholder="Write a reply…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      disabled={sending}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" asChild>
                        <Link href="/agent/leads">Leads</Link>
                      </Button>
                      <Button type="button" onClick={() => void sendReply()} disabled={sending || !draft.trim()}>
                        {sending ? "Sending…" : "Send"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function AgentMessagesPage() {
  return (
    <Suspense fallback={<PortalLoading label="Loading inbox…" />}>
      <AgentMessagesPageInner />
    </Suspense>
  )
}
