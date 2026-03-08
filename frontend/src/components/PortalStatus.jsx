const STATE_NAMES = { CA: "California", TX: "Texas", NY: "New York", FL: "Florida", IL: "Illinois" };

export default function PortalStatusBar({ portalStates }) {
  const entries = Object.entries(portalStates);
  if (entries.length === 0) return null;

  return (
    <div className="flex gap-3">
      {entries.map(([code, state]) => {
        const isActive = ["connecting", "navigating", "extracting"].includes(state.status);
        const isDone = state.status === "complete";
        const isError = state.status === "error";
        const count = state.results?.length || 0;

        return (
          <div
            key={code}
            className="flex-1 px-4 py-3 transition-all"
            style={{
              border: `1px solid ${isActive ? "var(--red)" : "var(--border)"}`,
              background: isActive ? "var(--red-dim)" : "transparent",
              boxShadow: isActive ? "inset 0 0 15px rgba(255,26,26,0.05)" : "none",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "var(--red)",
                      boxShadow: "var(--red-glow)",
                      animation: "blink 2s infinite",
                    }}
                  />
                )}
                <span className="font-mono text-xs font-medium" style={{ color: isActive ? "var(--red)" : isDone ? "var(--text-1)" : "var(--text-2)" }}>
                  {code}
                </span>
              </div>
              {isDone && (
                <span className="font-mono text-[10px]" style={{ color: "var(--text-2)" }}>{state.elapsed}s</span>
              )}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider truncate" style={{
              color: isError ? "#ff4444" : isActive ? "var(--red)" : isDone && count > 0 ? "var(--text-1)" : "var(--text-2)",
            }}>
              {isDone && count > 0 ? `${count} FOUND` : isDone ? "NO RESULTS" : isError ? "ERROR" : state.message || "QUEUED"}
            </div>
          </div>
        );
      })}
      <style>{`@keyframes blink { 0%{opacity:.2} 50%{opacity:1} 100%{opacity:.2} }`}</style>
    </div>
  );
}
