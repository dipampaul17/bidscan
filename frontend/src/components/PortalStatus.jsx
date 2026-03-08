const STATUS_MAP = {
  idle:        { color: "text-zinc-600",    dot: "bg-zinc-700",    bg: "" },
  connecting:  { color: "text-cyan-400",    dot: "bg-cyan-400",    bg: "bg-cyan-400/5" },
  navigating:  { color: "text-amber-400",   dot: "bg-amber-400",   bg: "bg-amber-400/5" },
  extracting:  { color: "text-blue-400",    dot: "bg-blue-400",    bg: "bg-blue-400/5" },
  complete:    { color: "text-emerald-400", dot: "bg-emerald-400", bg: "bg-emerald-400/5" },
  error:       { color: "text-red-400",     dot: "bg-red-400",     bg: "bg-red-400/5" },
};

const STATE_NAMES = {
  CA: "California",
  TX: "Texas",
  NY: "New York",
  FL: "Florida",
  IL: "Illinois",
};

export default function PortalStatusBar({ portalStates }) {
  const entries = Object.entries(portalStates);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-3">
      {entries.map(([code, state]) => {
        const cfg = STATUS_MAP[state.status] || STATUS_MAP.idle;
        const count = state.results?.length || 0;
        const isActive = ["connecting", "navigating", "extracting"].includes(state.status);

        return (
          <div
            key={code}
            className={`rounded-xl border border-white/[0.06] px-4 py-3 transition-all ${cfg.bg}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {isActive && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
                </span>
                <span className="text-sm font-semibold text-zinc-200">{code}</span>
              </div>
              {state.status === "complete" && (
                <span className="text-[11px] font-mono text-zinc-500">{state.elapsed}s</span>
              )}
            </div>
            <div className="text-[11px] text-zinc-500 mb-1">{STATE_NAMES[code]}</div>
            <div className={`text-xs truncate ${cfg.color}`}>
              {state.status === "complete" && count > 0
                ? `${count} opportunities found`
                : state.status === "complete"
                ? "No results"
                : state.status === "error"
                ? state.message
                : state.message || "Waiting..."}
            </div>
          </div>
        );
      })}
    </div>
  );
}
