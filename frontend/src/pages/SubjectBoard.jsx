import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import Loader from "../components/Loader";
import TopicCard from "../components/TopicCard";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function SubjectBoard() {
  const { groupId, subjectId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [selected, setSelected] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { data: group, isError: groupError, refetch: refetchGroup } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => (await api.get(`/groups/${groupId}`)).data
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", groupId],
    queryFn: async () => (await api.get(`/subjects/${groupId}`)).data
  });
  const { data: topics = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["topics", subjectId],
    queryFn: async () => (await api.get(`/topics/${groupId}/subject/${subjectId}`)).data
  });
  const subject = subjects.find(item => item._id === subjectId);
  const isAdmin = group?.members?.some(member => (member.user?._id || member.user) === user?._id && member.role === "admin");

  useEffect(() => {
    if (!socket) return;
    socket.emit("joinGroupRoom", groupId);
    const refresh = () => qc.invalidateQueries({ queryKey: ["topics", subjectId] });
    socket.on("topic:statusUpdated", refresh);
    socket.on("topic:assigned", refresh);
    return () => {
      socket.off("topic:statusUpdated", refresh);
      socket.off("topic:assigned", refresh);
    };
  }, [socket, groupId, subjectId, qc]);

  const create = async event => {
    event.preventDefault();
    setError("");
    try {
      await api.post(`/topics/${groupId}/subject/${subjectId}`, { title: title.trim() });
      setTitle("");
      await qc.invalidateQueries({ queryKey: ["topics", subjectId] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't create that topic. Please try again.");
    }
  };

  const updateStatus = async (id, status) => {
    setError("");
    try {
      await api.patch(`/topics/${groupId}/${id}/status`, { status });
      await qc.invalidateQueries({ queryKey: ["topics", subjectId] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't update the topic. Please try again.");
    }
  };

  const openAssign = topic => {
    setAssignModal(topic);
    setSelected(topic.assignedTo?.map(member => member._id || member) || []);
    setError("");
  };

  const assign = async () => {
    if (!assignModal) return;
    setError("");
    setIsSaving(true);
    try {
      await api.post(`/topics/${groupId}/${assignModal._id}/assign`, { userIds: selected });
      setAssignModal(null);
      await qc.invalidateQueries({ queryKey: ["topics", subjectId] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't update the assignment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader />;
  if (groupError || isError) return (
    <main className="app-page">
      <div role="alert" className="surface mx-auto max-w-lg p-8 text-center">
        <h1 className="font-bold text-[#30364a]">Topics didn't load.</h1>
        <p className="mt-2 text-sm text-[#858b99]">Check your connection and try again.</p>
        <button type="button" className="primary-button focus-ring mt-4" onClick={() => { refetchGroup(); refetch(); }}>Try again</button>
      </div>
    </main>
  );

  const completed = topics.filter(topic => topic.status === "done").length;
  return (
    <main className="app-page">
      <Link to={`/groups/${groupId}`} className="focus-ring rounded text-sm font-semibold text-[#747b8b] hover:text-[#5865d8]">← Back to group</Link>
      <div className="mb-6 mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow">Subject workspace</p>
          <h1 className="page-title">{subject?.title || "Topics"}</h1>
          <p className="page-subtitle">{completed} of {topics.length} topics completed</p>
        </div>
        {topics.length > 0 && <div className="w-full max-w-[190px]">
          <div className="mb-2 flex justify-between text-xs font-semibold text-[#858b99]"><span>Progress</span><span>{Math.round(completed / topics.length * 100)}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eff0f5]"><div className="h-full rounded-full bg-[#6dbda0]" style={{ width: `${completed / topics.length * 100}%` }} /></div>
        </div>}
      </div>

      {isAdmin && <form onSubmit={create} className="surface mb-5 flex flex-col gap-2 p-4 sm:flex-row">
        <label className="sr-only" htmlFor="topic-title">New topic name</label>
        <input id="topic-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Add a topic to your plan" maxLength={100} className="field flex-1" required />
        <button type="submit" className="primary-button focus-ring">Add topic</button>
      </form>}
      {error && <p role="alert" className="mb-4 rounded-xl border border-[#f1d2cf] bg-[#fff7f6] px-4 py-3 text-sm text-[#a14843]">{error}</p>}

      {topics.length ? (
        <div className="grid gap-3 md:grid-cols-2">{topics.map(topic => <TopicCard key={topic._id} topic={topic} groupId={groupId} onStatusChange={updateStatus} onAssign={openAssign} isAdmin={isAdmin} currentUserId={user._id} />)}</div>
      ) : (
        <div className="surface px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0efff] text-lg font-bold text-[#5865d8]" aria-hidden="true">01</span>
          <h2 className="mt-3 font-bold text-[#3d4351]">Start with one small topic.</h2>
          <p className="mt-1 text-sm text-[#858b99]">{isAdmin ? "Add the first topic above and build out your study plan." : "Your group admin can add topics to this subject."}</p>
        </div>
      )}

      {assignModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202540]/45 p-4 backdrop-blur-sm" onClick={() => setAssignModal(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="assign-title" className="surface w-full max-w-md p-6" onClick={event => event.stopPropagation()}>
          <p className="page-eyebrow">Share the work</p>
          <h2 id="assign-title" className="mt-1 font-[Manrope] text-xl font-extrabold tracking-[-.03em] text-[#30364a]">Assign this topic</h2>
          <p className="mt-1 truncate text-sm text-[#858b99]">{assignModal.title}</p>
          <div className="mt-5 max-h-60 space-y-1 overflow-y-auto">
            {group?.members?.map(member => {
              const memberId = member.user?._id || member.user;
              return <label key={memberId} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#4c5260] transition hover:bg-[#f7f8fb]">
                <input type="checkbox" checked={selected.includes(memberId)} onChange={event => setSelected(previous => event.target.checked ? [...new Set([...previous, memberId])] : previous.filter(id => id !== memberId))} className="h-4 w-4 accent-[#5865d8]" />
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eeefff] text-xs font-bold text-[#5865d8]">{member.user?.name?.charAt(0).toUpperCase() || "M"}</span>
                <span className="font-semibold">{member.user?.name || "Group member"}</span>
              </label>;
            })}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setAssignModal(null)} className="quiet-button focus-ring">Cancel</button>
            <button type="button" onClick={assign} disabled={isSaving} className="primary-button focus-ring">{isSaving ? "Saving..." : "Save assignments"}</button>
          </div>
        </section>
      </div>}
    </main>
  );
}
