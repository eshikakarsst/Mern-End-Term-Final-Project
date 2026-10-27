import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";
import Loader from "../components/Loader";
import SessionCard from "../components/SessionCard";
import { useAuth } from "../context/AuthContext";

const initialForm = { title: "", scheduledAt: "", durationMins: 60, mode: "online" };

export default function Sessions() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { data: sessions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["sessions", groupId],
    queryFn: async () => (await api.get(`/sessions/${groupId}`)).data
  });

  const create = async event => {
    event.preventDefault();
    setError("");
    setIsCreating(true);
    try {
      await api.post(`/sessions/${groupId}`, form);
      setForm(initialForm);
      await qc.invalidateQueries({ queryKey: ["sessions", groupId] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't schedule that session. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const rsvp = async (id, status) => {
    setError("");
    try {
      await api.patch(`/sessions/${groupId}/${id}/rsvp`, { status });
      await qc.invalidateQueries({ queryKey: ["sessions", groupId] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't update your response. Please try again.");
    }
  };

  if (isLoading) return <Loader />;
  const upcomingSessions = sessions.filter(session => new Date(session.scheduledAt) >= new Date());

  return (
    <main className="app-page">
      <Link to={`/groups/${groupId}`} className="focus-ring rounded text-sm font-semibold text-[#747b8b] hover:text-[#5865d8]">← Back to group</Link>
      <div className="mb-7 mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="page-eyebrow">Make time for it</p>
          <h1 className="page-title">Study sessions</h1>
          <p className="page-subtitle">A little structure makes studying together easier.</p>
        </div>
        <div className="surface px-4 py-3">
          <p className="font-bold text-[#30364a]">{upcomingSessions.length} upcoming</p>
          <p className="text-xs text-[#9298a6]">on the group calendar</p>
        </div>
      </div>

      <form onSubmit={create} className="surface mb-7 p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-bold text-[#30364a]">Plan a session</h2>
          <p className="mt-1 text-sm text-[#858b99]">Pick a time and let the group know you'll be there.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#676e7d] sm:col-span-2">Session name
            <input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="For example, Chapter 4 review" maxLength={100} className="field mt-1.5" required />
          </label>
          <label className="text-xs font-semibold text-[#676e7d]">Date and time
            <input type="datetime-local" value={form.scheduledAt} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={event => setForm({ ...form, scheduledAt: event.target.value })} className="field mt-1.5" required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[#676e7d]">Duration
              <input type="number" min="15" max="720" step="15" value={form.durationMins} onChange={event => setForm({ ...form, durationMins: Number(event.target.value) })} className="field mt-1.5" required />
            </label>
            <label className="text-xs font-semibold text-[#676e7d]">Format
              <select value={form.mode} onChange={event => setForm({ ...form, mode: event.target.value })} className="field mt-1.5">
                <option value="online">Online</option>
                <option value="offline">In person</option>
              </select>
            </label>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-[#f1d2cf] bg-[#fff7f6] px-4 py-3 text-sm text-[#a14843]">{error}</p>}
        <button type="submit" className="primary-button focus-ring mt-4 w-full sm:w-auto" disabled={isCreating}>{isCreating ? "Scheduling..." : "Schedule session"}</button>
      </form>

      {isError ? (
        <div role="alert" className="surface p-8 text-center">
          <p className="font-semibold text-[#3d4351]">Sessions didn't load.</p>
          <button type="button" onClick={() => refetch()} className="quiet-button focus-ring mt-3">Try again</button>
        </div>
      ) : sessions.length ? (
        <section>
          <h2 className="mb-3 font-bold text-[#30364a]">Your group's schedule</h2>
          <div className="space-y-3">{sessions.map(session => <SessionCard key={session._id} session={session} onRsvp={rsvp} currentUserId={user._id} />)}</div>
        </section>
      ) : (
        <div className="surface px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0efff] text-lg font-bold text-[#5865d8]" aria-hidden="true">01</span>
          <h2 className="mt-3 font-bold text-[#3d4351]">Nothing on the calendar yet.</h2>
          <p className="mt-1 text-sm text-[#858b99]">Schedule your first session above and get everyone together.</p>
        </div>
      )}
    </main>
  );
}
