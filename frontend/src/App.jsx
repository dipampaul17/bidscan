import { useState } from "react";
import SearchForm from "./components/SearchForm";
import PortalStatusBar from "./components/PortalStatus";
import ResultsTable from "./components/ResultsTable";
import { useSearch } from "./hooks/useSearch";

export default function App() {
  const { portalStates, results, searching, elapsed, done, search, cancel } = useSearch();
  const hasActivity = Object.keys(portalStates).length > 0;
  const totalFound = results.length;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">BidScan</span>
          </div>

          <div className="flex items-center gap-4">
            {searching && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </span>
                <span className="font-mono text-xs">{elapsed}s</span>
              </div>
            )}
            {done && totalFound > 0 && (
              <div className="text-xs text-zinc-500">
                <span className="font-mono text-zinc-300">{totalFound}</span> results in{" "}
                <span className="font-mono text-zinc-300">{elapsed}s</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Search section */}
        <div className="mb-8">
          <SearchForm onSearch={search} searching={searching} onCancel={cancel} />
        </div>

        {/* Portal status */}
        {hasActivity && (
          <div className="mb-6">
            <PortalStatusBar portalStates={portalStates} />
          </div>
        )}

        {/* Results */}
        {hasActivity && <ResultsTable results={results} done={done} elapsed={elapsed} />}

        {/* Empty state */}
        {!hasActivity && (
          <div className="flex flex-col items-center justify-center pt-32 pb-20">
            <div className="text-zinc-800 font-mono text-6xl font-bold tracking-tighter">
              $200B+
            </div>
            <p className="mt-4 text-zinc-500 text-base max-w-lg text-center leading-relaxed">
              Annual state & local procurement spending flows through portals with no APIs.
              BidScan scans them in parallel using web agents.
            </p>
            <div className="mt-8 flex items-center gap-6 text-xs text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                5 state portals
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                Real-time streaming
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                Parallel crawling
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
