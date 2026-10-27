import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import api from "../api/axios";
import Loader from "../components/Loader";

const COLORS = ["#d9dce6", "#f0c879", "#6dbda0"];
const cardClass = "surface p-5 sm:p-6";

export default function Dashboard() {
  const { groupId } = useParams();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", groupId],
    queryFn: async () => (await api.get(`/dashboard/${groupId}`)).data
  });

  if (isLoading) return <Loader />;
  if (isError) return (
    <main className="app-page">
      <div role="alert" className="surface mx-auto max-w-lg p-8 text-center">
        <h1 className="font-bold text-[#30364a]">Your dashboard isn't available right now.</h1>
        <p className="mt-2 text-sm text-[#858b99]">Check your connection and give it another try.</p>
        <button type="button" className="primary-button focus-ring mt-4" onClick={() => refetch()}>Try again</button>
      </div>
    </main>
  );

  const pieData = [
    { name: "Not started", value: data.totals.notStarted },
    { name: "In progress", value: data.totals.inProgress },
    { name: "Done", value: data.totals.done }
  ];

  return (
    <main className="app-page">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link to={`/groups/${groupId}`} className="focus-ring rounded text-sm font-semibold text-[#747b8b] hover:text-[#5865d8]">← Back to group</Link>
          <p className="page-eyebrow mt-5">Your group at a glance</p>
          <h1 className="page-title">Progress dashboard</h1>
          <p className="page-subtitle">A little progress adds up. Here's how the team is doing.</p>
        </div>
        <Link to={`/groups/${groupId}/sessions`} className="primary-button focus-ring">Plan a study session <span aria-hidden="true">→</span></Link>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-3" aria-label="Group totals">
        <div className="surface relative overflow-hidden p-5 sm:p-6">
          <span className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-[#eeefff]" aria-hidden="true" />
          <p className="relative text-sm font-semibold text-[#858b99]">Overall completion</p>
          <p className="relative mt-3 font-[Manrope] text-4xl font-extrabold tracking-[-.05em] text-[#5865d8]">{data.totals.completionRate}<span className="text-xl">%</span></p>
          <p className="relative mt-1 text-xs text-[#9a9fac]">{data.totals.done} of {data.totals.total} topics completed</p>
        </div>
        <div className="surface p-5 sm:p-6">
          <p className="text-sm font-semibold text-[#858b99]">Topics in your plan</p>
          <p className="mt-3 font-[Manrope] text-4xl font-extrabold tracking-[-.05em] text-[#30364a]">{data.totals.total}</p>
          <p className="mt-1 text-xs text-[#9a9fac]">{data.totals.inProgress} currently in progress</p>
        </div>
        <div className="surface p-5 sm:p-6">
          <p className="text-sm font-semibold text-[#858b99]">Upcoming sessions</p>
          <p className="mt-3 font-[Manrope] text-4xl font-extrabold tracking-[-.05em] text-[#25866a]">{data.upcomingSessions}</p>
          <p className="mt-1 text-xs text-[#9a9fac]">Keep the momentum going</p>
        </div>
      </section>

      <section className="mb-4 grid gap-4 md:grid-cols-2">
        <div className={cardClass}>
          <div className="mb-4">
            <h2 className="font-bold text-[#30364a]">Topic status</h2>
            <p className="mt-1 text-xs text-[#9298a6]">How work is moving across the group</p>
          </div>
          {data.totals.total ? (
            <div className="grid items-center gap-2 sm:grid-cols-[1fr_150px]">
              <div className="h-[210px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4} stroke="none">
                      {pieData.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {pieData.map((item, index) => <div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-[#777e8d]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />{item.name}</span><strong className="text-[#3e4555]">{item.value}</strong></div>)}
              </div>
            </div>
          ) : <div className="flex h-[210px] items-center justify-center text-sm text-[#9298a6]">Add a topic to start tracking progress.</div>}
        </div>

        <div className={cardClass}>
          <div className="mb-4">
            <h2 className="font-bold text-[#30364a]">Member contribution</h2>
            <p className="mt-1 text-xs text-[#9298a6]">Assigned work and completed topics</p>
          </div>
          {data.memberBreakdown.length ? (
            <div className="h-[230px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.memberBreakdown} margin={{ top: 8, right: 4, left: -20, bottom: 4 }}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#f6f7fa" }} />
                  <Bar dataKey="assigned" name="Assigned" fill="#c6cbf7" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#5865d8" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="flex h-[230px] items-center justify-center text-sm text-[#9298a6]">Assign topics to see team contributions.</div>}
        </div>
      </section>

      <section className="mb-4 grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <div className={cardClass}>
          <div className="mb-5">
            <h2 className="font-bold text-[#30364a]">Subject progress</h2>
            <p className="mt-1 text-xs text-[#9298a6]">Completion by subject</p>
          </div>
          {data.subjectBreakdown.length ? <div className="space-y-5">
            {data.subjectBreakdown.map(subject => <div key={subject.subjectId}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="truncate font-semibold text-[#505767]">{subject.title}</span><span className="shrink-0 text-xs font-semibold text-[#72798a]">{subject.done}/{subject.total} · {subject.completionRate}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eff0f5]"><div className="h-full rounded-full bg-[#7480e1] transition-[width]" style={{ width: `${subject.completionRate}%` }} /></div>
            </div>)}
          </div> : <p className="py-8 text-center text-sm text-[#9298a6]">Create a subject to organize your topics.</p>}
        </div>

        <div className={cardClass}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#30364a]">Needs a nudge</h2>
              <p className="mt-1 text-xs text-[#9298a6]">No progress in 3 or more days</p>
            </div>
            {data.staleTopics.length > 0 && <span className="rounded-full bg-[#fff3e7] px-2.5 py-1 text-xs font-bold text-[#ae7535]">{data.staleTopics.length}</span>}
          </div>
          {data.staleTopics.length ? (
            <ul className="space-y-2.5">
              {data.staleTopics.map(topic => <li key={topic.id} className="rounded-xl bg-[#faf8f4] px-3.5 py-3">
                <p className="font-semibold text-[#4c5260]">{topic.title}</p>
                <p className="mt-1 text-xs capitalize text-[#9298a6]">{topic.status.replace("_", " ")}</p>
              </li>)}
            </ul>
          ) : <div className="rounded-xl bg-[#f0f8f5] px-4 py-6 text-center">
            <p className="font-semibold text-[#347d65]">Everyone's on track</p>
            <p className="mt-1 text-xs text-[#719b8d]">No topics need a nudge right now.</p>
          </div>}
        </div>
      </section>
    </main>
  );
}
