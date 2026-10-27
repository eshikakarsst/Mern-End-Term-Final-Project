export default function SessionCard({ session, onRsvp, currentUserId }) {
  const myRsvp = session.rsvps?.find(response => (response.user?._id || response.user) === currentUserId)?.status || "maybe";
  const date = new Date(session.scheduledAt);
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date);
  const timeLabel = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  const attending = session.rsvps?.filter(response => response.status === "yes").length || 0;
  const options = [
    { value: "yes", label: "I'm in" },
    { value: "maybe", label: "Maybe" },
    { value: "no", label: "Can't make it" }
  ];

  return (
    <article className="surface flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex min-w-[66px] flex-col items-center rounded-xl bg-[#f0efff] px-2 py-2.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#737bce]">{dateLabel.split(" ")[0]}</span>
          <span className="font-[Manrope] text-xl font-extrabold text-[#5865d8]">{date.getDate()}</span>
        </div>
        <div>
          <h3 className="font-bold text-[#30364a]">{session.title}</h3>
          <p className="mt-1 text-sm text-[#747b8b]">{dateLabel} at {timeLabel}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#9298a6]">
            <span className="rounded-full bg-[#f3f4f7] px-2.5 py-1 capitalize">{session.mode === "offline" ? "In person" : "Online"}</span>
            <span>{session.durationMins} min</span>
            <span aria-hidden="true">·</span>
            <span>{attending} {attending === 1 ? "person" : "people"} going</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Your RSVP">
        {options.map(option => <button key={option.value} type="button" aria-pressed={myRsvp === option.value} onClick={() => onRsvp(session._id, option.value)} className={`focus-ring rounded-lg border px-3 py-2 text-xs font-semibold transition ${myRsvp === option.value ? "border-[#5865d8] bg-[#5865d8] text-white shadow-sm" : "border-[#e5e7ee] bg-white text-[#747b8b] hover:border-[#cfd3e5] hover:bg-[#f8f8fc]"}`}>{option.label}</button>)}
      </div>
    </article>
  );
}
