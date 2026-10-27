import { useEffect, useMemo, useRef, useState } from "react";

const TIMER_STORAGE = "studysync-focus-timer";
const HISTORY_STORAGE = "studysync-focus-history";
const DURATION_STORAGE = "studysync-focus-durations";
const DEFAULT_DURATIONS = { focus: 25, shortBreak: 5, longBreak: 15 };
const phaseLabels = { focus: "Focus time", shortBreak: "Short break", longBreak: "Long break" };

const readDurations = () => {
  const saved = readStoredValue(DURATION_STORAGE, {});
  return Object.fromEntries(Object.entries(DEFAULT_DURATIONS).map(([phase, fallback]) => {
    const value = saved?.[phase];
    return [phase, Number.isInteger(value) && value >= 1 && value <= 180 ? value : fallback];
  }));
};

const asSeconds = minutes => minutes * 60;

const readStoredValue = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function FocusTimer() {
  const [durations, setDurations] = useState(readDurations);
  const [durationDraft, setDurationDraft] = useState(() => ({ ...readDurations() }));
  const [settingsMessage, setSettingsMessage] = useState("");
  const [timer, setTimer] = useState(() => {
    const stored = readStoredValue(TIMER_STORAGE, null);
    const savedDurations = readDurations();
    if (!stored || !["focus", "shortBreak", "longBreak"].includes(stored.phase)) return { phase: "focus", remaining: asSeconds(savedDurations.focus), running: false, endAt: null, completed: 0, cycleCount: 0 };
    const completed = Number.isInteger(stored.completed) && stored.completed >= 0 ? stored.completed : 0;
    const cycleCount = Number.isInteger(stored.cycleCount) && stored.cycleCount >= 0 ? stored.cycleCount : completed;
    const endAt = Number.isFinite(stored.endAt) ? stored.endAt : null;
    if (stored.running && endAt) return { ...stored, completed, cycleCount, remaining: Math.max(0, Math.ceil((endAt - Date.now()) / 1000)), endAt };
    const phaseDuration = asSeconds(savedDurations[stored.phase]);
    const remaining = Number.isFinite(stored.remaining) ? Math.max(0, Math.min(phaseDuration, stored.remaining)) : phaseDuration;
    return { ...stored, completed, cycleCount, remaining, running: false, endAt: null };
  });
  const [history, setHistory] = useState(() => {
    const stored = readStoredValue(HISTORY_STORAGE, []);
    return Array.isArray(stored) ? stored.filter(item => item && typeof item.id === "string" && Number.isFinite(new Date(item.completedAt).getTime()) && Number.isFinite(item.minutes)).slice(0, 30) : [];
  });
  const timerRef = useRef(timer);
  const completedEndRef = useRef(null);
  timerRef.current = timer;

  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE, JSON.stringify(timer));
  }, [timer]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE, JSON.stringify(history.slice(0, 30)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(DURATION_STORAGE, JSON.stringify(durations));
  }, [durations]);

  useEffect(() => {
    if (!timer.running || !timer.endAt) return undefined;
    const endAt = timer.endAt;
    const phase = timer.phase;
    const completed = timer.completed;
    const cycleCount = timer.cycleCount;
    const tick = () => {
      if (timerRef.current.endAt !== endAt) return;
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (remaining > 0) {
        setTimer(current => current.endAt === endAt ? { ...current, remaining } : current);
        return;
      }
      if (completedEndRef.current === endAt) return;
      completedEndRef.current = endAt;
      const nextCompleted = phase === "focus" ? completed + 1 : completed;
      const nextCycleCount = phase === "focus" ? cycleCount + 1 : cycleCount;
      if (phase === "focus") setHistory(current => [{ id: `${endAt}`, completedAt: new Date().toISOString(), minutes: durations.focus }, ...current].slice(0, 30));
      const nextPhase = phase === "focus" ? (nextCycleCount % 4 === 0 ? "longBreak" : "shortBreak") : "focus";
      const nextDuration = asSeconds(durations[nextPhase]);
      setTimer(current => current.endAt === endAt ? {
        phase: nextPhase,
        remaining: nextDuration,
        running: true,
        endAt: Date.now() + nextDuration * 1000,
        completed: nextCompleted,
        cycleCount: nextCycleCount
      } : current);
    };
    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [durations, timer.completed, timer.cycleCount, timer.endAt, timer.phase, timer.running]);

  const progress = useMemo(() => {
    const total = asSeconds(durations[timer.phase]);
    return Math.max(0, Math.min(100, ((total - timer.remaining) / total) * 100));
  }, [timer.phase, timer.remaining]);

  const toggleTimer = () => {
    setTimer(current => {
      if (current.running) return { ...current, running: false, endAt: null };
      return { ...current, running: true, endAt: Date.now() + current.remaining * 1000 };
    });
  };

  const selectPhase = phase => {
    setTimer(current => ({
      ...current,
      phase,
      remaining: asSeconds(durations[phase]),
      running: false,
      endAt: null
    }));
  };

  const updateDurationDraft = (phase, value) => {
    setSettingsMessage("");
    setDurationDraft(current => ({ ...current, [phase]: value === "" ? "" : Number(value) }));
  };

  const saveDurations = event => {
    event.preventDefault();
    const valid = Object.values(durationDraft).every(value => Number.isInteger(value) && value >= 1 && value <= 180);
    if (!valid) {
      setSettingsMessage("Choose a whole number between 1 and 180 minutes for each timer.");
      return;
    }
    setDurations({ ...durationDraft });
    setTimer(current => ({ ...current, running: false, endAt: null, remaining: asSeconds(durationDraft[current.phase]) }));
    setSettingsMessage("Timer lengths saved. The current interval has been reset.");
  };

  const resetTimer = () => setTimer(current => ({ ...current, running: false, endAt: null, remaining: asSeconds(durations[current.phase]) }));
  const clearHistory = () => setHistory([]);

  return (
    <main className="app-page">
      <div className="mb-8">
        <p className="page-eyebrow">Take a breath, then begin</p>
        <h1 className="page-title">Focus timer</h1>
        <p className="page-subtitle">One focused block at a time. Your timer stays with you if you leave this page.</p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_.8fr]">
        <section className="surface overflow-hidden p-6 text-center sm:p-10">
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Choose timer phase">
            {Object.entries(phaseLabels).map(([phase, label]) => <button key={phase} type="button" aria-pressed={timer.phase === phase} onClick={() => selectPhase(phase)} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition ${timer.phase === phase ? "bg-[#f0efff] text-[#5865d8]" : "bg-[#f4f5f8] text-[#737b8c] hover:bg-[#eceefa] hover:text-[#5865d8]"}`}>{label} · {durations[phase]}m</button>)}
          </div>
          <div className="mx-auto mt-8 flex h-64 w-64 items-center justify-center rounded-full p-3" style={{ background: `conic-gradient(#6571db ${progress}%, #eff0f5 ${progress}% 100%)` }}>
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
              <span className="font-[Manrope] text-[64px] font-extrabold leading-none tracking-[-.06em] text-[#30364a] tabular-nums">{formatTime(timer.remaining)}</span>
              <span className="mt-3 text-xs font-semibold uppercase tracking-[.14em] text-[#9298a6]">{timer.running ? "Stay in the moment" : "Ready when you are"}</span>
            </div>
          </div>
          <div className="mt-7 flex justify-center gap-3">
            <button type="button" onClick={toggleTimer} className="primary-button focus-ring min-w-32">{timer.running ? "Pause" : timer.remaining < asSeconds(durations[timer.phase]) ? "Resume" : timer.phase === "focus" ? "Start focus" : "Start break"}</button>
            <button type="button" onClick={resetTimer} className="quiet-button focus-ring">Reset</button>
          </div>
          <div className="mt-7 flex items-center justify-center gap-2 text-sm text-[#858b99]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f6f1] text-xs font-bold text-[#25866a]">{timer.completed}</span>
            focus {timer.completed === 1 ? "session" : "sessions"} completed
          </div>
        </section>

        <aside className="surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#30364a]">Focus history</h2>
              <p className="mt-1 text-sm text-[#858b99]">Your recent completed focus blocks</p>
            </div>
            {history.length > 0 && <button type="button" onClick={clearHistory} className="focus-ring rounded px-2 py-1 text-xs font-semibold text-[#858b99] hover:text-[#aa5049]">Clear</button>}
          </div>
          {history.length ? <ul className="mt-5 space-y-2">
            {history.map(item => <li key={item.id} className="flex items-center justify-between rounded-xl bg-[#f7f8fb] px-4 py-3">
              <span className="text-sm font-semibold text-[#505767]">Focus block</span>
              <span className="text-right text-xs text-[#858b99]">{item.minutes} min · {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(item.completedAt))}</span>
            </li>)}
          </ul> : <div className="mt-5 rounded-xl bg-[#f7f8fb] px-5 py-8 text-center">
            <p className="font-semibold text-[#505767]">Your first focus block is waiting.</p>
            <p className="mt-1 text-xs text-[#9298a6]">Completed sessions will appear here.</p>
          </div>}
          <div className="mt-5 rounded-xl border border-[#eeeff5] p-4">
            <h3 className="text-sm font-bold text-[#505767]">The rhythm</h3>
            <p className="mt-1 text-xs leading-5 text-[#858b99]">After four focus blocks, take a longer break. The timer moves through the cycle for you.</p>
          </div>
          <form onSubmit={saveDurations} className="mt-5 border-t border-[#eff0f5] pt-5">
            <h3 className="text-sm font-bold text-[#30364a]">Your timer lengths</h3>
            <p className="mt-1 text-xs leading-5 text-[#858b99]">Choose any duration from 1 to 180 minutes. Your settings are saved on this device.</p>
            <div className="mt-4 space-y-3">
              {Object.entries(phaseLabels).map(([phase, label]) => <label key={phase} className="flex items-center justify-between gap-3 text-xs font-semibold text-[#596174]">
                <span>{label}</span>
                <span className="flex items-center gap-2">
                  <input type="number" min="1" max="180" step="1" required value={durationDraft[phase]} onChange={event => updateDurationDraft(phase, event.target.value)} aria-label={`${label} duration in minutes`} className="field min-h-9 w-20 px-2 text-right text-sm tabular-nums" />
                  <span className="w-8 text-[#9298a6]">min</span>
                </span>
              </label>)}
            </div>
            {settingsMessage && <p role="status" className="mt-3 text-xs text-[#348166]">{settingsMessage}</p>}
            <button type="submit" className="quiet-button focus-ring mt-4 w-full">Save timer lengths</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
