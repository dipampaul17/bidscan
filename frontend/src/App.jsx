import SearchForm from "./components/SearchForm";
import PortalStatusBar from "./components/PortalStatus";
import ResultsTable from "./components/ResultsTable";
import { useSearch } from "./hooks/useSearch";

export default function App() {
  const { portalStates, results, searching, elapsed, done, lastQuery, search, cancel, clearResults } = useSearch();
  const hasActivity = Object.keys(portalStates).length > 0;
  const totalFound = results.length;
  const portalsSearched = Object.values(portalStates).filter((p) => p.status === "complete").length;
  const portalsTotal = Object.keys(portalStates).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col h-full max-w-[1600px] mx-auto w-full px-6 lg:px-8 py-5 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>BIDSCAN</span>
            <span className="font-mono text-[10px] tracking-wider px-2 py-0.5" style={{
              color: "var(--text-2)", border: "1px solid var(--border)"
            }}>
              PROCUREMENT INTELLIGENCE
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs">
            {searching && (
              <div className="flex items-center gap-2" style={{ color: "var(--red)" }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{
                  background: "var(--red)", boxShadow: "var(--red-glow)", animation: "blink 2s infinite"
                }} />
                SCANNING
              </div>
            )}
            {!searching && lastQuery && (
              <span style={{ color: "var(--text-3)" }}>
                "{lastQuery.keywords}" · {lastQuery.states.join(",")}
              </span>
            )}
            {hasActivity && <span style={{ color: "var(--text-2)" }}>{elapsed}s</span>}
            {totalFound > 0 && (
              <span style={{ color: "var(--red)" }}>{totalFound} FOUND</span>
            )}
            {!searching && hasActivity && (
              <button
                onClick={clearResults}
                className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 cursor-pointer transition-all"
                style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => { e.target.style.color = "var(--text-2)"; e.target.style.borderColor = "var(--text-2)"; }}
                onMouseLeave={(e) => { e.target.style.color = "var(--text-3)"; e.target.style.borderColor = "var(--border)"; }}
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0 relative pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <SearchForm onSearch={search} searching={searching} onCancel={cancel} lastQuery={lastQuery} />
          {searching && (
            <div className="absolute bottom-[-1px] left-0 h-[1px]" style={{
              background: "var(--red)", boxShadow: "var(--red-glow)",
              animation: "scanline 4s ease-in-out infinite",
            }}>
              <div className="absolute right-0 top-[-2px] w-1 h-1 rounded-full" style={{
                background: "var(--red)", boxShadow: "var(--red-glow)"
              }} />
            </div>
          )}
        </div>

        {/* Portal Status */}
        {hasActivity && (
          <div className="shrink-0">
            <PortalStatusBar portalStates={portalStates} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-h-0" style={{
          border: hasActivity ? "1px solid var(--border)" : "none",
          background: hasActivity ? "rgba(10,10,10,0.3)" : "transparent",
        }}>
          {hasActivity ? (
            <ResultsTable results={results} done={done} elapsed={elapsed} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <p className="text-sm max-w-md text-center leading-relaxed" style={{ color: "var(--text-2)" }}>
                Enter keywords to scan state procurement portals in parallel.
                Results stream in real-time as agents navigate each portal.
              </p>
              <div className="flex gap-6 font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                <span>5 STATE PORTALS</span>
                <span>PARALLEL AGENTS</span>
                <span>REAL-TIME SSE</span>
              </div>
            </div>
          )}
        </main>

        {/* Footer status */}
        {hasActivity && (
          <footer className="shrink-0 flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-6">
              <Metric label="STATUS" value={searching ? "ACTIVE" : "COMPLETE"} highlight={searching} />
              <Metric label="PORTALS" value={`${portalsSearched}/${portalsTotal}`} />
              <Metric label="ELAPSED" value={`${elapsed}s`} />
            </div>
            <div className="flex items-center gap-6">
              {totalFound > 0 && <Metric label="MATCHES" value={`${totalFound}`} highlight />}
              {done && totalFound > 0 && (
                <Metric label="TIME SAVED" value={`~${(totalFound * 8 / 60).toFixed(1)}h`} />
              )}
            </div>
          </footer>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0% { left: 0; width: 20%; }
          50% { left: 40%; width: 30%; }
          100% { left: 80%; width: 20%; }
        }
        @keyframes blink { 0%{opacity:.2} 50%{opacity:1} 100%{opacity:.2} }
      `}</style>
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.15em]" style={{ color: "var(--text-3)" }}>{label}</div>
      <div className="font-mono text-xs" style={{ color: highlight ? "var(--red)" : "var(--text-2)" }}>{value}</div>
    </div>
  );
}
