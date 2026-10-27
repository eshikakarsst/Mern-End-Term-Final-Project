import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [blinking, setBlinking] = useState(false);
  const blinkTimeout = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
    refetchInterval: 60_000
  });
  const unread = notifications.filter(notification => !notification.read).length;

  useEffect(() => {
    if (!socket) return undefined;
    const handleNewNotification = notification => {
      queryClient.setQueryData(["notifications"], current => [
        notification,
        ...(current || []).filter(item => item._id !== notification._id)
      ].slice(0, 50));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setBlinking(true);
      clearTimeout(blinkTimeout.current);
      blinkTimeout.current = setTimeout(() => setBlinking(false), 1800);
    };
    socket.on("notification:new", handleNewNotification);
    return () => {
      socket.off("notification:new", handleNewNotification);
      clearTimeout(blinkTimeout.current);
    };
  }, [queryClient, socket]);

  const markRead = async notification => {
    setError("");
    try {
      if (!notification.read) {
        await api.patch(`/notifications/${notification._id}/read`);
        queryClient.setQueryData(["notifications"], current => current?.map(item => item._id === notification._id ? { ...item, read: true } : item));
      }
      setOpen(false);
      if (notification.link) navigate(notification.link);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Couldn't update this notification.");
    }
  };

  const markAllRead = async () => {
    setError("");
    try {
      await api.patch("/notifications/read-all");
      queryClient.setQueryData(["notifications"], current => current?.map(item => ({ ...item, read: true })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Couldn't mark notifications as read.");
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => { setOpen(previous => !previous); setBlinking(false); }} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} className={`focus-ring relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6e8ef] text-lg text-[#626a7b] transition hover:bg-[#f7f8fb] ${blinking ? "notification-bell-blink" : ""}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e16d68] px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[#e9ebf1] bg-white shadow-[0_20px_60px_rgba(32,39,68,.16)]">
        <div className="flex items-center justify-between border-b border-[#f0f1f5] px-4 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-[#30364a]">Notifications</h2>
            <p className="mt-0.5 text-xs text-[#9298a6]">{unread ? `${unread} unread` : "You're all caught up"}</p>
          </div>
          {unread > 0 && <button type="button" onClick={markAllRead} className="focus-ring rounded px-2 py-1 text-xs font-semibold text-[#5865d8] hover:bg-[#f3f4ff]">Mark all read</button>}
        </div>
        {error && <p role="alert" className="px-4 pt-3 text-xs text-[#a14843]">{error}</p>}
        {notifications.length ? <ul className="max-h-[360px] overflow-y-auto">
          {notifications.map(notification => <li key={notification._id} className="border-b border-[#f5f5f8] last:border-0">
            <button type="button" onClick={() => markRead(notification)} className={`focus-ring w-full px-4 py-3.5 text-left transition hover:bg-[#f8f8fc] ${notification.read ? "" : "bg-[#f7f8ff]"}`}>
              <span className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-transparent" : "bg-[#6571db]"}`} aria-hidden="true" />
                <span>
                  <span className="block text-sm leading-5 text-[#454b5a]">{notification.message}</span>
                  <time className="mt-1 block text-[11px] text-[#9a9fac]" dateTime={notification.createdAt}>{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(notification.createdAt))}</time>
                </span>
              </span>
            </button>
          </li>)}
        </ul> : <div className="px-5 py-9 text-center">
          <span className="text-2xl text-[#9298a6]" aria-hidden="true">·</span>
          <p className="mt-2 text-sm font-semibold text-[#505767]">No notifications yet</p>
          <p className="mt-1 text-xs text-[#9298a6]">Group activity will show up here.</p>
        </div>}
      </div>}
    </div>
  );
}
