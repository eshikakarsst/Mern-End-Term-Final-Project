import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Loader from "../components/Loader";

const dateTimeLocal = date => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export default function Planner() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueAt, setDueAt] = useState(() => dateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [groupId, setGroupId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [filter, setFilter] = useState("open");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await api.get("/tasks")).data
  });
  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await api.get("/groups")).data
  });
  const visibleTasks = useMemo(() => tasks.filter(task => filter === "all" || (filter === "open" ? !task.completed : task.completed)), [filter, tasks]);
  const openCount = tasks.filter(task => !task.completed).length;
  const topicOptionsQuery = useQuery({
    queryKey: ["planner-topic-options", groupId],
    queryFn: async () => {
      const group = groups.find(item => item._id === groupId);
      if (!group) return [];
      const subjectResponse = await api.get(`/subjects/${groupId}`);
      const topicResponses = await Promise.all(subjectResponse.data.map(subject => api.get(`/topics/${groupId}/subject/${subject._id}`)));
      return topicResponses.flatMap(response => response.data);
    },
    enabled: Boolean(groupId)
  });
  const topicOptions = topicOptionsQuery.data || [];

  const createTask = async event => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/tasks", { title: title.trim(), notes: notes.trim(), dueAt: new Date(dueAt).toISOString(), ...(groupId ? { groupId } : {}), ...(topicId ? { topicId } : {}) });
      setTitle("");
      setNotes("");
      setTopicId("");
      setDueAt(dateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't add that task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (task, completed) => {
    setError("");
    try {
      await api.patch(`/tasks/${task._id}`, { completed });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't update that task.");
    }
  };

  const deleteTask = async task => {
    setError("");
    try {
      await api.delete(`/tasks/${task._id}`);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't delete that task.");
    }
  };

  if (isLoading) return <Loader />;

  return (
    <main className="app-page">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="page-eyebrow">One step at a time</p>
          <h1 className="page-title">My study planner</h1>
          <p className="page-subtitle">Keep assignments, deadlines, and your next move in one place.</p>
        </div>
        <div className="surface px-4 py-3">
          <p className="font-bold text-[#30364a]">{openCount} to do</p>
          <p className="text-xs text-[#9298a6]">{tasks.length - openCount} completed</p>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={createTask} className="surface p-5 sm:p-6">
          <h2 className="font-bold text-[#30364a]">Add a study task</h2>
          <p className="mt-1 text-sm text-[#858b99]">A clear next step makes a big goal easier.</p>
          {error && <p role="alert" className="mt-4 rounded-xl border border-[#f1d2cf] bg-[#fff7f6] px-3 py-2.5 text-sm text-[#a14843]">{error}</p>}
          <label className="mt-5 block text-xs font-semibold text-[#676e7d]">Task
            <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Read chapter 3" maxLength={140} className="field mt-1.5" required />
          </label>
          <label className="mt-4 block text-xs font-semibold text-[#676e7d]">Due date
            <input type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)} className="field mt-1.5" required />
          </label>
          <label className="mt-4 block text-xs font-semibold text-[#676e7d]">Study group <span className="font-normal text-[#9a9fac]">· optional</span>
            <select value={groupId} onChange={event => { setGroupId(event.target.value); setTopicId(""); }} className="field mt-1.5">
              <option value="">Personal task</option>
              {groups.map(group => <option key={group._id} value={group._id}>{group.name}</option>)}
            </select>
          </label>
          {groupId && <label className="mt-4 block text-xs font-semibold text-[#676e7d]">Link a topic <span className="font-normal text-[#9a9fac]">· optional</span>
            <select value={topicId} onChange={event => setTopicId(event.target.value)} className="field mt-1.5" disabled={topicOptionsQuery.isLoading}>
              <option value="">No linked topic</option>
              {topicOptions.map(topic => <option key={topic._id} value={topic._id}>{topic.title}</option>)}
            </select>
          </label>}
          {topicOptionsQuery.isError && <p role="alert" className="mt-2 text-xs text-[#a14843]">Topic list couldn't be loaded.</p>}
          <label className="mt-4 block text-xs font-semibold text-[#676e7d]">Notes <span className="font-normal text-[#9a9fac]">· optional</span>
            <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Anything to remember?" maxLength={1000} rows={3} className="field mt-1.5 resize-y py-3" />
          </label>
          <button type="submit" disabled={saving} className="primary-button focus-ring mt-5 w-full">{saving ? "Adding task..." : "Add to planner"}</button>
        </form>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#30364a]">Your tasks</h2>
              <p className="mt-1 text-sm text-[#858b99]">Personal deadlines and group-linked tasks</p>
            </div>
            <label>
              <span className="sr-only">Filter tasks</span>
              <select value={filter} onChange={event => setFilter(event.target.value)} className="field min-w-[145px] text-sm">
                <option value="open">To do</option>
                <option value="done">Completed</option>
                <option value="all">All tasks</option>
              </select>
            </label>
          </div>
          {isError ? <div role="alert" className="surface p-7 text-center">
            <p className="font-semibold text-[#3d4351]">Your tasks didn't load.</p>
            <button type="button" onClick={() => refetch()} className="quiet-button focus-ring mt-3">Try again</button>
          </div> : visibleTasks.length ? <div className="space-y-3">
            {visibleTasks.map(task => {
              const isOverdue = !task.completed && new Date(task.dueAt) < new Date();
              return <article key={task._id} className={`surface flex items-start gap-3 p-4 sm:p-5 ${task.completed ? "opacity-75" : ""}`}>
                <input type="checkbox" checked={task.completed} onChange={event => updateTask(task, event.target.checked)} aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`} className="mt-1 h-4 w-4 shrink-0 accent-[#5865d8]" />
                <div className="min-w-0 flex-1">
                  <h3 className={`font-semibold ${task.completed ? "text-[#9298a6] line-through" : "text-[#3d4351]"}`}>{task.title}</h3>
                  {task.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-[#858b99]">{task.notes}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <time dateTime={task.dueAt} className={isOverdue ? "font-semibold text-[#bf625c]" : "text-[#858b99]"}>{isOverdue ? "Overdue · " : "Due "}{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(task.dueAt))}</time>
                    {task.group && <Link to={`/groups/${task.group._id}`} className="rounded-full bg-[#f0efff] px-2.5 py-1 font-semibold text-[#626dc9] hover:bg-[#e8e9ff]">{task.group.name}</Link>}
                    {task.topic && <span className="rounded-full bg-[#f1f3f6] px-2.5 py-1 text-[#747b8b]">{task.topic.title}</span>}
                  </div>
                </div>
                <button type="button" onClick={() => deleteTask(task)} aria-label={`Delete ${task.title}`} className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-[#9a9fac] hover:bg-[#fff1ef] hover:text-[#aa5049]">Delete</button>
              </article>;
            })}
          </div> : <div className="surface px-6 py-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f6f1] text-lg font-bold text-[#25866a]" aria-hidden="true">✓</span>
            <h3 className="mt-3 font-bold text-[#3d4351]">{filter === "done" ? "Nothing completed yet." : filter === "all" ? "Your planner is clear." : "You're all caught up."}</h3>
            <p className="mt-1 text-sm text-[#858b99]">{filter === "open" ? "Add a task when you have a next step in mind." : "Tasks you add will appear here."}</p>
          </div>}
        </section>
      </div>
    </main>
  );
}
