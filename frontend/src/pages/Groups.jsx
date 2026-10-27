import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

const getRole = (group, userId) => group.members?.find(member => (member.user?._id || member.user) === userId)?.role || "member";
const formatDate = date => date
  ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(date))
  : "Recently created";

export default function Groups() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [error, setError] = useState("");
  const [copiedGroupId, setCopiedGroupId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const { data: groups = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await api.get("/groups")).data
  });

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return groups
      .filter(group => {
        const role = getRole(group, user?._id);
        const matchesRole = filter === "all" || role === filter;
        const matchesSearch = !query || group.name.toLowerCase().includes(query) || group.inviteCode.toLowerCase().includes(query);
        return matchesRole && matchesSearch;
      })
      .sort((a, b) => sort === "name"
        ? a.name.localeCompare(b.name)
        : new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [filter, groups, search, sort, user?._id]);

  const create = async event => {
    event.preventDefault();
    setError("");
    setIsCreating(true);
    try {
      await api.post("/groups", { name: groupName.trim() });
      setGroupName("");
      await qc.invalidateQueries({ queryKey: ["groups"] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't create your group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const join = async event => {
    event.preventDefault();
    setError("");
    setIsJoining(true);
    try {
      await api.post("/groups/join", { inviteCode: inviteCode.trim() });
      setInviteCode("");
      await qc.invalidateQueries({ queryKey: ["groups"] });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't find that invite code. Check it and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const copyInviteCode = async (event, group) => {
    event.preventDefault();
    event.stopPropagation();
    setError("");
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopiedGroupId(group._id);
    } catch {
      setError("Could not copy the invite code. Select and copy it manually.");
    }
  };

  if (isLoading) return <Loader />;

  const ownedCount = groups.filter(group => getRole(group, user?._id) === "admin").length;
  return (
    <main className="app-page">
      <section className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="page-eyebrow">Your learning space</p>
          <h1 className="page-title">Study, better together.</h1>
          <p className="page-subtitle">Bring your people and your next big idea into one place.</p>
        </div>
        <div className="flex gap-3">
          <div className="surface min-w-[105px] px-4 py-3">
            <p className="text-xl font-bold tracking-tight text-[#30364a]">{groups.length}</p>
            <p className="mt-0.5 text-xs text-[#8a90a0]">Your groups</p>
          </div>
          <div className="surface min-w-[105px] px-4 py-3">
            <p className="text-xl font-bold tracking-tight text-[#5865d8]">{ownedCount}</p>
            <p className="mt-0.5 text-xs text-[#8a90a0]">You manage</p>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="mb-5 rounded-xl border border-[#f1d2cf] bg-[#fff7f6] px-4 py-3 text-sm text-[#a14843]">{error}</div>}

      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <form onSubmit={create} className="surface flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#eeefff] text-lg font-semibold text-[#5865d8]" aria-hidden="true">+</span>
            <h2 className="font-bold text-[#30364a]">Start a new group</h2>
            <p className="mt-1 text-sm leading-5 text-[#858b99]">Create a space for your next study goal.</p>
          </div>
          <div className="flex w-full gap-2 sm:max-w-[260px]">
            <input aria-label="New group name" value={groupName} onChange={event => setGroupName(event.target.value)} placeholder="Group name" maxLength={60} className="field min-w-0" required />
            <button type="submit" className="primary-button focus-ring px-4" disabled={isCreating}>{isCreating ? "Creating" : "Create"}</button>
          </div>
        </form>

        <form onSubmit={join} className="surface flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f6f1] text-sm font-bold text-[#25866a]" aria-hidden="true">IN</span>
            <h2 className="font-bold text-[#30364a]">Join your people</h2>
            <p className="mt-1 text-sm leading-5 text-[#858b99]">Have an invite code? Enter it to join.</p>
          </div>
          <div className="flex w-full gap-2 sm:max-w-[260px]">
            <input aria-label="Group invite code" value={inviteCode} onChange={event => setInviteCode(event.target.value)} placeholder="Invite code" autoCapitalize="characters" className="field min-w-0 uppercase" required />
            <button type="submit" className="quiet-button focus-ring px-4" disabled={isJoining}>{isJoining ? "Joining" : "Join"}</button>
          </div>
        </form>
      </section>

      <section aria-labelledby="groups-heading">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="groups-heading" className="font-bold text-[#30364a]">Your study groups</h2>
            <p className="mt-1 text-sm text-[#858b99]">{groups.length ? `${groups.length} spaces to keep your momentum going` : "Your next great study session starts here"}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:w-56">
              <span className="sr-only">Search groups</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#959baa]" aria-hidden="true">⌕</span>
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search groups or codes" className="field pl-9 text-sm" />
            </label>
            <label>
              <span className="sr-only">Filter groups by role</span>
              <select value={filter} onChange={event => setFilter(event.target.value)} className="field min-w-[135px] text-sm">
                <option value="all">All roles</option>
                <option value="admin">I manage</option>
                <option value="member">I'm a member</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Sort groups</span>
              <select value={sort} onChange={event => setSort(event.target.value)} className="field min-w-[130px] text-sm">
                <option value="recent">Most recent</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
          </div>
        </div>

        {isError ? (
          <div className="surface p-8 text-center">
            <p className="font-semibold text-[#3d4351]">We couldn't load your groups.</p>
            <p className="mt-1 text-sm text-[#858b99]">Check your connection and try again.</p>
            <button type="button" onClick={() => refetch()} className="primary-button focus-ring mt-4">Try again</button>
          </div>
        ) : filteredGroups.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredGroups.map(group => {
              const role = getRole(group, user?._id);
              const initials = group.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
              return (
                <article key={group._id} className="surface group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-[#d9dcf5] hover:shadow-[0_14px_34px_rgba(32,39,68,.09)]">
                  <Link to={`/groups/${group._id}`} className="focus-ring block p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-[#eef0ff] to-[#e4e6ff] text-sm font-bold text-[#5865d8]">{initials || "SG"}</span>
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-[#30364a] transition group-hover:text-[#5865d8]">{group.name}</h3>
                          <p className="mt-1 text-xs text-[#9298a6]">Created {formatDate(group.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${role === "admin" ? "bg-[#f0efff] text-[#5865d8]" : "bg-[#f1f3f6] text-[#7b8290]"}`}>
                        {role === "admin" ? "ADMIN" : "MEMBER"}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-[#f0f1f5] pt-4">
                      <span className="text-sm text-[#747b8b]"><strong className="font-semibold text-[#454b5a]">{group.members?.length || 0}</strong> {group.members?.length === 1 ? "member" : "members"}</span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#737b8c] transition group-hover:text-[#5865d8]">
                        Open group <span aria-hidden="true" className="transition group-hover:translate-x-0.5">→</span>
                      </span>
                    </div>
                  </Link>
                  <div className="mx-5 mb-5 flex items-center justify-between rounded-lg bg-[#f7f8fb] px-3 py-2 sm:mx-6 sm:mb-6">
                    <span className="text-xs text-[#858b99]">Invite code <strong className="ml-1 font-mono font-semibold tracking-wider text-[#545b6b]">{group.inviteCode}</strong></span>
                    <button type="button" onClick={event => copyInviteCode(event, group)} className="focus-ring rounded px-2 py-1 text-xs font-semibold text-[#5865d8] hover:bg-white">
                      {copiedGroupId === group._id ? "Copied" : "Copy"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : groups.length ? (
          <div className="surface px-6 py-12 text-center">
            <h3 className="font-bold text-[#3d4351]">No groups match that search</h3>
            <p className="mt-1 text-sm text-[#858b99]">Try another name, invite code, or role filter.</p>
            <button type="button" onClick={() => { setSearch(""); setFilter("all"); }} className="quiet-button focus-ring mt-4">Clear filters</button>
          </div>
        ) : (
          <div className="surface flex flex-col items-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0efff] text-xl font-bold text-[#5865d8]" aria-hidden="true">S</span>
            <h3 className="mt-4 font-bold text-[#3d4351]">A fresh start feels good.</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-[#858b99]">Create a group for your class or join one with an invite code. Your shared study space will show up here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
