import { useState, useMemo } from "react";

export default function ResultsTable({ results, done, elapsed }) {
  const [expandedId, setExpandedId] = useState(null);

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      // Urgent (< 7 days) first, then by score
      const aUrgent = a.days_remaining !== null && a.days_remaining <= 7;
      const bUrgent = b.days_remaining !== null && b.days_remaining <= 7;
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return b.match_score - a.match_score;
    });
  }, [results]);

  if (results.length === 0 && !done) return null;
  if (results.length === 0 && done) {
    return (
      <div className="flex items-center justify-center h-full font-mono text-sm" style={{ color: "var(--text-2)" }}>
        NO MATCHING OPPORTUNITIES
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          {["REF ID", "PROJECT TITLE", "AGENCY", "NAICS", "DEADLINE", "STATUS"].map((h, i) => (
            <th
              key={h}
              className={`text-left px-5 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] font-normal sticky top-0 z-10 ${
                i >= 4 ? "text-right" : ""
              }`}
              style={{ color: "var(--text-2)", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => {
          const isExpanded = expandedId === r.id;
          const isUrgent = r.days_remaining !== null && r.days_remaining <= 3;
          const isLive = r.days_remaining !== null && r.days_remaining <= 7;
          const deadlineText = r.days_remaining !== null
            ? r.days_remaining === 0 ? "TODAY" : `${r.days_remaining}d`
            : r.deadline || "--";

          return (
            <tr
              key={r.id}
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              className="cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid var(--border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <td className="px-5 py-4 font-mono text-xs whitespace-nowrap" style={{ color: "var(--text-2)", width: "10%" }}>
                {r.source_state}-{(r.solicitation_number || r.id).slice(-5)}
              </td>
              <td className="px-5 py-4" style={{ width: "38%" }}>
                <div className="text-sm" style={{ color: "var(--text-1)" }}>
                  {r.title}
                </div>
                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    {r.description && (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{r.description}</p>
                    )}
                    {r.solicitation_number && (
                      <div className="font-mono text-[10px]" style={{ color: "var(--text-3)" }}>
                        SOL: {r.solicitation_number}
                      </div>
                    )}
                    {r.set_aside && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-mono" style={{
                        border: "1px solid var(--red)", color: "var(--red)", background: "var(--red-dim)"
                      }}>
                        {r.set_aside}
                      </span>
                    )}
                    {r.source_url && (
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="block text-xs underline transition-colors mt-1"
                        style={{ color: "var(--text-2)" }}
                        onMouseEnter={(e) => e.target.style.color = "var(--red)"}
                        onMouseLeave={(e) => e.target.style.color = "var(--text-2)"}
                      >
                        VIEW ON PORTAL
                      </a>
                    )}
                  </div>
                )}
              </td>
              <td className="px-5 py-4 text-xs" style={{ color: "var(--text-2)", width: "15%" }}>
                <span className="line-clamp-1">{r.agency || "--"}</span>
              </td>
              <td className="px-5 py-4 font-mono text-xs" style={{ color: "var(--text-2)", width: "12%" }}>
                {r.category || "--"}
              </td>
              <td className="px-5 py-4 text-right font-mono text-xs whitespace-nowrap" style={{ width: "12%" }}>
                <span style={{ color: isUrgent ? "var(--red)" : isLive ? "#ffaa00" : "var(--text-2)" }}>
                  {deadlineText}
                </span>
              </td>
              <td className="px-5 py-4 text-right" style={{ width: "13%" }}>
                <div className="flex items-center justify-end gap-2">
                  {(isUrgent || isLive) && (
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        background: isUrgent ? "var(--red)" : "#ffaa00",
                        boxShadow: isUrgent ? "var(--red-glow)" : "0 0 10px rgba(255,170,0,0.4)",
                        animation: "blink 2s infinite",
                      }}
                    />
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-wider" style={{
                    color: isUrgent ? "var(--red)" : isLive ? "#ffaa00" : "var(--text-2)"
                  }}>
                    {isUrgent ? "URGENT" : isLive ? "LIVE" : "OPEN"}
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
