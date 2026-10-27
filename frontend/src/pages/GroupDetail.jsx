import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const { data: group, isLoading: isGroupLoading, isError: groupError, refetch: refetchGroup } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => (await api.get(`/groups/${groupId}`)).data
  });
  const { data: subjects = [], isLoading: areSubjectsLoading, isError: subjectsError, refetch: refetchSubjects } = useQuery({
    queryKey: ["subjects", groupId],
    queryFn: async () => (await api.get(`/subjects/${groupId}`)).data
  });

  if (isGroupLoading || areSubjectsLoading) return <Loader />;
  if (groupError || !group) return (
    <main className="app-page">
      <div role="alert" className="surface mx-auto max-w-lg p-8 text-center">
        <h1 className="font-bold text-[#30364a]">We couldn't open this group.</h1>
        <p className="mt-2 text-sm text-[#858b99]">It may have been removed, or your connection may be unavailable.</p>
        <button type="button" className="primary-button focus-ring mt-4" onClick={() => refetchGroup()}>Try again</button>
      </div>
    </main>
  );

  const isAdmin = group.members.some(member => (member.user?._id || member.user) === user?._id && member.role === "admin");
  const create = async event => {
    event.preventDefault();
    setError("");
    try {
      await api.post(`/subjects/${groupId}`, { title: title.trim() });
      setTitle("");
      await qc.invalidateQueries({ queryKey: ["subjects", groupId] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't create that subject. Please try again.");
    }
  };

  return (
    <main className="app-page">
      <Link to="/groups" className="focus-ring rounded text-sm font-semibold text-[#747b8b] hover:text-[#5865d8]">← All groups</Link>
      <section className="surface relative mt-5 overflow-hidden p-6 sm:p-9">
        <span className="absolute -right-14 -top-20 h-52 w-52 rounded-full bg-[#f0efff]" aria-hidden="true" />
        <div className="relative">
          <p className="page-eyebrow">Study group</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="page-title">{group.name}</h1>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${isAdmin ? "bg-[#f0efff] text-[#5865d8]" : "bg-[#f1f3f6] text-[#7b8290]"}`}>{isAdmin ? "ADMIN" : "MEMBER"}</span>
          </div>
          <p className="page-subtitle">{group.members.length} {group.members.length === 1 ? "member" : "members"} learning together</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to={`/groups/${groupId}/dashboard`} className="primary-button focus-ring">View progress <span aria-hidden="true">→</span></Link>
            <Link to={`/groups/${groupId}/sessions`} className="quiet-button focus-ring">Study sessions</Link>
            <Link to={`/groups/${groupId}/chat`} className="quiet-button focus-ring">Group chat</Link>
          </div>
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="page-eyebrow">Build your plan</p>
            <h2 className="mt-1 font-[Manrope] text-xl font-extrabold tracking-[-.03em] text-[#30364a]">Subjects</h2>
          </div>
          <span className="text-sm text-[#858b99]">{subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</span>
        </div>

        {isAdmin && <form onSubmit={create} className="surface mb-4 flex flex-col gap-3 p-4 sm:flex-row">
          <label className="sr-only" htmlFor="subject-title">New subject name</label>
          <input id="subject-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Add a subject, for example Biology" maxLength={80} className="field flex-1" required />
          <button type="submit" className="primary-button focus-ring">Add subject</button>
        </form>}
        {error && <p role="alert" className="mb-4 rounded-xl border border-[#f1d2cf] bg-[#fff7f6] px-4 py-3 text-sm text-[#a14843]">{error}</p>}

        {subjectsError ? (
          <div role="alert" className="surface p-7 text-center">
            <p className="font-semibold text-[#3d4351]">Subjects didn't load.</p>
            <button type="button" onClick={() => refetchSubjects()} className="quiet-button focus-ring mt-3">Try again</button>
          </div>
        ) : subjects.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {subjects.map((subject, index) => (
              <Link key={subject._id} to={`/groups/${groupId}/subjects/${subject._id}`} className="focus-ring surface group flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:border-[#d9dcf5] hover:shadow-[0_12px_28px_rgba(32,39,68,.08)]">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2f3ff] text-xs font-bold text-[#6873d8]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="truncate font-bold text-[#3d4351] group-hover:text-[#5865d8]">{subject.title}</span>
                </span>
                <span aria-hidden="true" className="text-lg text-[#a5a9b5] transition group-hover:translate-x-1 group-hover:text-[#5865d8]">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="surface px-6 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0efff] text-lg font-bold text-[#5865d8]" aria-hidden="true">01</span>
            <h3 className="mt-3 font-bold text-[#3d4351]">Your plan starts with a subject.</h3>
            <p className="mt-1 text-sm text-[#858b99]">{isAdmin ? "Add your first subject above to start organizing topics." : "Ask your group admin to add the first subject."}</p>
          </div>
        )}
      </section>
    </main>
  );
}
