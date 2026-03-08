import { useState, useMemo } from "react";

const STATE_COLORS = {
  CA: { bg: "bg-blue-500/12", text: "text-blue-400", border: "border-blue-500/20" },
  TX: { bg: "bg-amber-500/12", text: "text-amber-400", border: "border-amber-500/20" },
  NY: { bg: "bg-violet-500/12", text: "text-violet-400", border: "border-violet-500/20" },
  FL: { bg: "bg-emerald-500/12", text: "text-emerald-400", border: "border-emerald-500/20" },
  IL: { bg: "bg-rose-500/12", text: "text-rose-400", border: "border-rose-500/20" },
};

function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-zinc-600";
  const textColor = pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-zinc-500";
  return (
    <div className="flex items-center gap-2 w-16">
      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-[11px] font-medium ${textColor}`}>{pct}</span>
    </div>
  );
}

function DeadlineCell({ deadline, daysRemaining }) {
  if (!deadline) return <span className="text-zinc-700 text-xs">--</span>;
  const urgent = daysRemaining !== null && daysRemaining <= 7;
  const critical = daysRemaining !== null && daysRemaining <= 3;
  return (
    <div className="text-right">
      <div className={`text-xs font-mono ${critical ? "text-red-400" : urgent ? "text-amber-400" : "text-zinc-400"}`}>
        {deadline}
      </div>
      {daysRemaining !== null && (
        <div className={`text-[10px] mt-0.5 ${critical ? "text-red-400 font-semibold" : urgent ? "text-amber-400" : "text-zinc-600"}`}>
          {daysRemaining === 0 ? "DUE TODAY" : `${daysRemaining}d left`}
        </div>
      )}
    </div>
  );
}

export default function ResultsTable({ results, done, elapsed }) {
  const [sortBy, setSortBy] = useState("score");
  const [filterState, setFilterState] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const states = useMemo(() => {
    return [...new Set(results.map((r) => r.source_state))].sort();
  }, [results]);

  const sorted = useMemo(() => {
    let list = filterState ? results.filter((r) => r.source_state === filterState) : results;
    return [...list].sort((a, b) => {
      if (sortBy === "score") return b.match_score - a.match_score;
      if (sortBy === "deadline") return (a.days_remaining ?? 999) - (b.days_remaining ?? 999);
      if (sortBy === "state") return a.source_state.localeCompare(b.source_state);
      if (sortBy === "value") {
        const parse = (v) => parseFloat((v || "0").replace(/[^0-9.]/g, "")) || 0;
        return parse(b.estimated_value) - parse(a.estimated_value);
      }
      return 0;
    });
  }, [results, sortBy, filterState]);

  if (results.length === 0 && !done) return null;

  const manualMinutes = Math.round(results.length * 8);
  const manualDisplay = manualMinutes >= 60
    ? `${(manualMinutes / 60).toFixed(1)}h`
    : `${manualMinutes}m`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-5">
          <h2 className="text-lg font-semibold text-zinc-100">
            {results.length > 0 ? (
              <>
                <span className="font-mono">{results.length}</span>
                <span className="text-zinc-400 font-normal ml-1.5">
                  {results.length === 1 ? "opportunity" : "opportunities"}
                </span>
              </>
            ) : done ? (
              <span className="text-zinc-500">No results found</span>
            ) : null}
          </h2>
          {done && results.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-400/8 border border-amber-400/15 rounded-lg px-3 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs text-amber-300">
                Manual estimate: <span className="font-mono font-semibold">{manualDisplay}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* State filter */}
          {states.length > 1 && (
            <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1">
              <button
                onClick={() => setFilterState(null)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filterState === null
                    ? "bg-white/[0.08] text-zinc-200"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                All
              </button>
              {states.map((s) => {
                const c = STATE_COLORS[s] || {};
                return (
                  <button
                    key={s}
                    onClick={() => setFilterState(filterState === s ? null : s)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      filterState === s
                        ? `${c.bg} ${c.text}`
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-zinc-400 focus:outline-none cursor-pointer"
          >
            <option value="score">Relevance</option>
            <option value="deadline">Deadline</option>
            <option value="value">Value</option>
            <option value="state">State</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {results.length === 0 && done ? (
        <div className="text-center py-20 text-zinc-600 text-sm">
          No opportunities matched your criteria. Try broader keywords or more portals.
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] text-zinc-500 uppercase tracking-widest">
                <th className="px-4 py-3 w-20">Match</th>
                <th className="px-4 py-3 w-14">State</th>
                <th className="px-4 py-3">Opportunity</th>
                <th className="px-4 py-3 w-40">Agency</th>
                <th className="px-4 py-3 w-28 text-right">Value</th>
                <th className="px-4 py-3 w-32 text-right">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, idx) => {
                const sc = STATE_COLORS[r.source_state] || {};
                const isExpanded = expandedId === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className={`border-t border-white/[0.04] cursor-pointer transition-colors ${
                      isExpanded ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <ScoreBar score={r.match_score} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${sc.bg} ${sc.text} ${sc.border} border`}>
                        {r.source_state}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-[14px] text-zinc-200 leading-snug">
                        {r.title}
                      </div>
                      {r.solicitation_number && (
                        <span className="text-[11px] text-zinc-600 font-mono mt-0.5 inline-block">
                          {r.solicitation_number}
                        </span>
                      )}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 pb-1">
                          {r.description && (
                            <p className="text-[13px] text-zinc-400 leading-relaxed">{r.description}</p>
                          )}
                          <div className="flex gap-1.5 flex-wrap">
                            {r.set_aside && (
                              <span className="text-[10px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded-md px-2 py-0.5 font-medium">
                                {r.set_aside}
                              </span>
                            )}
                            {r.category && (
                              <span className="text-[10px] bg-white/[0.04] text-zinc-500 border border-white/[0.06] rounded-md px-2 py-0.5">
                                {r.category}
                              </span>
                            )}
                            {r.match_reasons?.map((reason, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-blue-400/80 bg-blue-400/8 border border-blue-400/15 rounded-md px-2 py-0.5"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                          {r.source_url && (
                            <a
                              href={r.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 mt-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                            >
                              View on portal
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-zinc-500 max-w-[160px]">
                      <span className="line-clamp-2">{r.agency || "--"}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {r.estimated_value ? (
                        <span className="text-[13px] font-mono text-zinc-300">{r.estimated_value}</span>
                      ) : (
                        <span className="text-xs text-zinc-700">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <DeadlineCell deadline={r.deadline} daysRemaining={r.days_remaining} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
