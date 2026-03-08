import SearchForm from "./components/SearchForm";
import PortalStatusBar from "./components/PortalStatus";
import ResultsTable from "./components/ResultsTable";
import { useSearch } from "./hooks/useSearch";

export default function App() {
  const { portalStates, results, searching, elapsed, done, search, cancel } = useSearch();
  const hasActivity = Object.keys(portalStates).length > 0;
  const totalFound = results.length;

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ background: "var(--bg)" }}>
      {/* Watermark */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-extrabold pointer-events-none select-none z-0 whitespace-nowrap"
        style={{ color: "var(--text-3)", opacity: 0.04, letterSpacing: "-0.05em" }}
      >
        BIDSCAN
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-[1600px] mx-auto w-full px-6 lg:px-8 py-6 gap-5">
        {/* Control Deck */}
        <header className="relative pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <SearchForm onSearch={search} searching={searching} onCancel={cancel} />

          {/* Scan line */}
          {searching && (
            <div className="absolute bottom-[-1px] left-0 h-[1px] animate-pulse" style={{
              width: "30%",
              background: "var(--red)",
              boxShadow: "var(--red-glow)",
              animation: "scanline 3s ease-in-out infinite",
            }}>
              <div className="absolute right-0 top-[-2px] w-1 h-1 rounded-full" style={{
                background: "var(--red)", boxShadow: "var(--red-glow)"
              }} />
            </div>
          )}
        </header>

        {/* Portal Status */}
        {hasActivity && (
          <div className="shrink-0">
            <PortalStatusBar portalStates={portalStates} />
          </div>
        )}

        {/* Results viewport */}
        <main className="flex-1 overflow-y-auto min-h-0" style={{
          border: hasActivity ? "1px solid var(--border)" : "none",
          background: hasActivity ? "rgba(10,10,10,0.5)" : "transparent",
        }}>
          {hasActivity ? (
            <ResultsTable results={results} done={done} elapsed={elapsed} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="font-mono text-7xl font-bold tracking-tighter" style={{ color: "var(--text-3)" }}>
                $200B+
              </div>
              <p className="mt-4 text-sm max-w-lg text-center leading-relaxed" style={{ color: "var(--text-2)" }}>
                Annual state & local procurement spending flows through portals with no APIs.
                BidScan scans them in parallel using web agents.
              </p>
            </div>
          )}
        </main>

        {/* Status Bar */}
        <footer className="shrink-0 flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-8">
            <div>
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em]" style={{ color: "var(--text-2)" }}>System</div>
              <div className="text-sm" style={{ color: searching ? "var(--red)" : "var(--text-2)" }}>
                {searching ? "AGENTS ACTIVE" : "IDLE"}
              </div>
            </div>
            {hasActivity && (
              <div>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em]" style={{ color: "var(--text-2)" }}>Elapsed</div>
                <div className="text-sm font-mono">{elapsed}s</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-8">
            {totalFound > 0 && (
              <div className="text-right">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em]" style={{ color: "var(--text-2)" }}>Matches</div>
                <div className="text-sm font-mono" style={{ color: "var(--red)" }}>{totalFound} FOUND</div>
              </div>
            )}
            {done && totalFound > 0 && (
              <div className="text-right">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em]" style={{ color: "var(--text-2)" }}>Time Saved</div>
                <div className="text-sm font-mono">{(totalFound * 8 / 60).toFixed(1)}h</div>
              </div>
            )}
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes scanline {
          0% { left: 0; width: 30%; }
          50% { left: 35%; width: 40%; }
          100% { left: 70%; width: 30%; }
        }
      `}</style>
    </div>
  );
}
