import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Loader from "../components/Loader";

const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const sameDay = (first, second) => first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();

export default function Calendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const { data: groups = [], isLoading: groupsLoading, isError: groupsError, refetch: refetchGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await api.get("/groups")).data
  });
  const monthStart = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const gridStart = useMemo(() => new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - monthStart.getDay()), [monthStart]);
  const gridEnd = useMemo(() => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + 42), [gridStart]);
  const sessionQueries = useQueries({
    queries: groups.map(group => ({
      queryKey: ["sessions", group._id],
      queryFn: async () => (await api.get(`/sessions/${group._id}`)).data,
      enabled: Boolean(group._id)
    }))
  });
  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError, refetch: refetchTasks } = useQuery({
    queryKey: ["tasks", "calendar", gridStart.toISOString(), gridEnd.toISOString()],
    queryFn: async () => (await api.get("/tasks", { params: { from: gridStart.toISOString(), to: gridEnd.toISOString() } })).data
  });

  const sessions = sessionQueries.flatMap((query, index) => (query.data || []).map(session => ({ ...session, calendarGroup: groups[index] })));
  const sessionsLoading = sessionQueries.some(query => query.isLoading);
  const sessionsError = sessionQueries.some(query => query.isError);
  const events = useMemo(() => [
    ...sessions.map(session => ({ id: `session-${session._id}`, title: session.title, date: new Date(session.scheduledAt), kind: "session", group: session.calendarGroup })),
    ...tasks.filter(task => !task.completed).map(task => ({ id: `task-${task._id}`, title: task.title, date: new Date(task.dueAt), kind: "task", group: task.group }))
  ], [sessions, tasks]);
  const days = useMemo(() => Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)), [gridStart]);
  const selectedEvents = events.filter(event => sameDay(event.date, selectedDate)).sort((first, second) => first.date - second.date);

  if (groupsLoading || tasksLoading || sessionsLoading) return <Loader />;

  return (
    <main className="app-page">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="page-eyebrow">Plan time to learn</p>
          <h1 className="page-title">Study calendar</h1>
          <p className="page-subtitle">Group sessions and your task deadlines, all in one view.</p>
        </div>
        <Link to="/planner" className="primary-button focus-ring">Add a task <span aria-hidden="true">→</span></Link>
      </div>

      {(groupsError || tasksError || sessionsError) && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f1d2cf] bg-[#fff7f6] px-4 py-3 text-sm text-[#a14843]">
        <span>Some calendar items couldn't be loaded.</span>
        <button type="button" className="focus-ring rounded px-2 py-1 font-semibold underline" onClick={() => { refetchGroups(); refetchTasks(); sessionQueries.forEach(query => query.refetch()); }}>Retry</button>
      </div>}

      <section className="surface overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-[#eff0f5] p-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <h2 className="min-w-[155px] font-[Manrope] text-xl font-extrabold tracking-[-.03em] text-[#30364a]">{new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month)}</h2>
            <button type="button" onClick={() => { const today = new Date(); setMonth(startOfMonth(today)); setSelectedDate(today); }} className="quiet-button focus-ring min-h-8 px-3 text-xs">Today</button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous month" onClick={() => { const next = addMonths(month, -1); setMonth(next); setSelectedDate(next); }} className="quiet-button focus-ring min-h-9 w-9 px-0 text-lg">‹</button>
            <button type="button" aria-label="Next month" onClick={() => { const next = addMonths(month, 1); setMonth(next); setSelectedDate(next); }} className="quiet-button focus-ring min-h-9 w-9 px-0 text-lg">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-[#eff0f5] bg-[#fafbfc]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#9298a6] sm:py-3 sm:text-xs">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => {
            const dayEvents = events.filter(event => sameDay(event.date, day)).sort((first, second) => first.date - second.date);
            const isCurrentMonth = day.getMonth() === month.getMonth();
            const isToday = sameDay(day, new Date());
            return <button key={day.toISOString()} type="button" aria-pressed={sameDay(day, selectedDate)} aria-label={`${new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(day)}${dayEvents.length ? `, ${dayEvents.length} events` : ""}`} onClick={() => setSelectedDate(day)} className={`focus-ring min-h-[82px] border-b border-r border-[#f0f1f5] p-1.5 text-left last:border-r-0 sm:min-h-[115px] sm:p-2 ${isCurrentMonth ? "bg-white" : "bg-[#fafbfc]"} ${sameDay(day, selectedDate) ? "ring-2 ring-inset ring-[#aab0f0]" : ""}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-[#5865d8] text-white" : isCurrentMonth ? "text-[#555c6b]" : "text-[#c0c4cd]"}`}>{day.getDate()}</span>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map(event => <div key={event.id} title={`${event.kind === "session" ? "Session" : "Task"}: ${event.title}`} className={`truncate rounded px-1.5 py-1 text-[9px] font-semibold sm:px-2 sm:text-[11px] ${event.kind === "session" ? "bg-[#edeeff] text-[#5865d8]" : "bg-[#e8f6f1] text-[#327c64]"}`}>
                  <span className="hidden sm:inline">{event.kind === "session" ? "Session · " : "Task · "}</span>{event.title}
                </div>)}
                {dayEvents.length > 3 && <p className="px-1 text-[9px] font-semibold text-[#858b99] sm:text-[10px]">+{dayEvents.length - 3} more</p>}
              </div>
            </button>;
          })}
        </div>
        <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-[#747b8b] sm:px-6">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#5865d8]" /> Group sessions</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#5caa8c]" /> Task deadlines</span>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-bold text-[#30364a]">{sameDay(selectedDate, new Date()) ? "Today" : new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(selectedDate)}</h2>
        {selectedEvents.length ? <div className="space-y-2">
          {selectedEvents.map(event => <article key={event.id} className="surface flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#3d4351]">{event.title}</p>
              <p className="mt-1 text-xs text-[#858b99]">{event.kind === "session" ? "Group session" : "Task deadline"}{event.group?.name ? ` · ${event.group.name}` : ""} · {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(event.date)}</p>
            </div>
            {event.group?._id && <Link to={`/groups/${event.group._id}`} className="focus-ring shrink-0 rounded px-2 py-1 text-xs font-semibold text-[#5865d8] hover:bg-[#f3f4ff]">Open group</Link>}
            {event.kind === "task" && <Link to="/planner" className="focus-ring shrink-0 rounded px-2 py-1 text-xs font-semibold text-[#5865d8] hover:bg-[#f3f4ff]">Open planner</Link>}
          </article>)}
        </div> : <div className="surface px-5 py-7 text-center">
          <p className="font-semibold text-[#505767]">Nothing scheduled for today.</p>
          <p className="mt-1 text-sm text-[#9298a6]">Make some time for your next study goal.</p>
        </div>}
      </section>
    </main>
  );
}
