"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/actions/bids";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text || pending) return;
    const messageId = requestId.current ?? crypto.randomUUID();
    requestId.current = messageId;
    setStatus("Sending…");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversationId", conversationId);
      formData.set("body", text);
      formData.set("clientMessageId", messageId);
      const result = await sendMessageAction(formData);
      if (result?.error) {
        setStatus(result.error);
        requestId.current = null;
        return;
      }
      setBody("");
      setStatus("Sent");
      requestId.current = null;
      router.refresh();
      window.setTimeout(() => setStatus(null), 1800);
    });
  }

  return <form onSubmit={submit} className="chat-composer">
    <textarea name="body" rows={1} placeholder="Write a message" aria-label="Message" value={body} onChange={(event) => setBody(event.target.value)} disabled={pending} required />
    <span className={`chat-send-status${status?.includes("error") ? " is-error" : ""}`} aria-live="polite">{status}</span>
    <button className="chat-send" type="submit" disabled={pending || !body.trim()} aria-label={pending ? "Sending message" : "Send message"}>{pending ? "…" : "↑"}</button>
  </form>;
}
