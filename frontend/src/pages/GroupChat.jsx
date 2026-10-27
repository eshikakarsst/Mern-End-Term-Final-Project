import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function GroupChat() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(Boolean(socket?.connected));
  const bottomRef = useRef(null);
  const { data: group, isLoading: groupLoading, isError: groupError } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => (await api.get(`/groups/${groupId}`)).data
  });
  const { data: messages = [], isLoading: messagesLoading, isError: messagesError, refetch } = useQuery({
    queryKey: ["chat-messages", groupId],
    queryFn: async () => (await api.get(`/chat/${groupId}/messages`)).data,
    enabled: Boolean(socket)
  });

  useEffect(() => {
    if (!socket) return undefined;
    const join = () => {
      socket.emit("joinGroupRoom", groupId, result => {
        if (result?.error) {
          setConnected(false);
          setError(result.error);
        } else {
          setConnected(true);
          setError("");
        }
      });
    };
    const disconnect = () => setConnected(false);
    const receive = message => {
      if (message.group !== groupId && message.group?._id !== groupId) return;
      queryClient.setQueryData(["chat-messages", groupId], current => {
        const existing = current || [];
        return existing.some(item => item._id === message._id) ? existing : [...existing, message];
      });
    };
    socket.on("connect", join);
    socket.on("disconnect", disconnect);
    socket.on("connect_error", disconnect);
    socket.on("chat:message", receive);
    if (socket.connected) join();
    else setConnected(false);
    return () => {
      socket.off("connect", join);
      socket.off("disconnect", disconnect);
      socket.off("connect_error", disconnect);
      socket.off("chat:message", receive);
    };
  }, [groupId, queryClient, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = event => {
    event.preventDefault();
    const message = text.trim();
    if (!message || !socket || sending) return;
    setError("");
    setSending(true);
    socket.timeout(5000).emit("chat:send", { groupId, text: message }, (timeoutError, response) => {
      setSending(false);
      if (timeoutError) {
        setError("Message wasn't sent. Check your connection and try again.");
      } else if (response?.error) {
        setError(response.error);
      } else {
        setText("");
      }
    });
  };

  if (groupLoading || messagesLoading) return <Loader />;
  if (groupError || messagesError) return (
    <main className="app-page">
      <div role="alert" className="surface mx-auto max-w-lg p-8 text-center">
        <h1 className="font-bold text-[#30364a]">Group chat didn't load.</h1>
        <p className="mt-2 text-sm text-[#858b99]">Check your connection and try again.</p>
        <button type="button" className="primary-button focus-ring mt-4" onClick={() => refetch()}>Try again</button>
      </div>
    </main>
  );

  return (
    <main className="app-page">
      <Link to={`/groups/${groupId}`} className="focus-ring rounded text-sm font-semibold text-[#747b8b] hover:text-[#5865d8]">← Back to group</Link>
      <section className="surface mx-auto mt-5 flex h-[min(680px,calc(100vh-200px))] min-h-[440px] max-w-4xl flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[#eff0f5] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0efff] text-[#5865d8]" aria-hidden="true">✦</span>
            <div>
              <h1 className="font-bold text-[#30364a]">{group.name} chat</h1>
              <p className="text-xs text-[#9298a6]">{group.members.length} group members</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${connected ? "bg-[#e8f6f1] text-[#348166]" : "bg-[#fff4df] text-[#a3722e]"}`}>{connected ? "Live" : "Reconnecting"}</span>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto bg-[#fafbfc] px-4 py-5 sm:px-6">
          {messages.length ? messages.map(message => {
            const isMine = (message.sender?._id || message.sender) === user?._id;
            return <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <article className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${isMine ? "rounded-br-md bg-[#5865d8] text-white" : "rounded-bl-md border border-[#e9ebf1] bg-white text-[#3d4351]"}`}>
                {!isMine && <p className="mb-1 text-[11px] font-bold text-[#5865d8]">{message.sender?.name || "Group member"}</p>}
                <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.text}</p>
                <time dateTime={message.createdAt} className={`mt-1.5 block text-right text-[10px] ${isMine ? "text-white/70" : "text-[#a0a5b0]"}`}>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</time>
              </article>
            </div>;
          }) : <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0efff] text-lg text-[#5865d8]" aria-hidden="true">✦</span>
            <h2 className="mt-3 font-bold text-[#3d4351]">Start the conversation.</h2>
            <p className="mt-1 max-w-xs text-sm text-[#858b99]">Share a question, a useful link, or a time to study together.</p>
          </div>}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="border-t border-[#eff0f5] bg-white p-3 sm:p-4">
          {error && <p role="alert" className="mb-2 px-2 text-xs text-[#a14843]">{error}</p>}
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor="chat-message">Message</label>
            <textarea id="chat-message" value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Write a message..." maxLength={2000} rows={1} className="field max-h-32 min-h-11 flex-1 resize-y py-3" />
            <button type="submit" className="primary-button focus-ring min-h-11 px-4" disabled={!text.trim() || sending || !connected}>{sending ? "Sending..." : "Send"}</button>
          </div>
          <p className="mt-2 px-1 text-[10px] text-[#a0a5b0]">Enter to send · Shift + Enter for a new line</p>
        </form>
      </section>
    </main>
  );
}
