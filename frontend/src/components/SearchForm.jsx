import { useState } from "react";

const STATES = [
  { code: "CA", name: "California", portal: "Cal eProcure" },
  { code: "TX", name: "Texas", portal: "TxSmartBuy" },
  { code: "NY", name: "New York", portal: "NYS Contract Reporter" },
  { code: "FL", name: "Florida", portal: "MyFloridaMarketPlace" },
  { code: "IL", name: "Illinois", portal: "BidBuy" },
];

const NAICS_CODES = [
  { code: "", label: "All categories", desc: "" },
  { code: "541512", label: "Computer Systems Design", desc: "IT consulting, infrastructure" },
  { code: "541511", label: "Custom Programming", desc: "Software development" },
  { code: "541519", label: "Other Computer Services", desc: "Tech support, hosting" },
  { code: "541611", label: "Management Consulting", desc: "Strategy, operations" },
  { code: "541330", label: "Engineering Services", desc: "Civil, electrical, mechanical" },
  { code: "236220", label: "Commercial Construction", desc: "Buildings, facilities" },
  { code: "238210", label: "Electrical & Cabling", desc: "Fiber optic, low voltage" },
  { code: "561210", label: "Facilities Support", desc: "Building maintenance" },
  { code: "561720", label: "Janitorial Services", desc: "Cleaning, custodial" },
  { code: "561612", label: "Security Guards", desc: "Physical security" },
  { code: "511210", label: "Software Publishers", desc: "SaaS, packaged software" },
  { code: "518210", label: "Data Processing & Hosting", desc: "Cloud, data centers" },
  { code: "541690", label: "Scientific Consulting", desc: "Technical advisory" },
  { code: "541110", label: "Legal Services", desc: "Law firms, counsel" },
];

export default function SearchForm({ onSearch, searching, onCancel }) {
  const [keywords, setKeywords] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [selectedStates, setSelectedStates] = useState(["CA", "TX", "NY"]);

  const toggleState = (code) => {
    setSelectedStates((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keywords.trim() || selectedStates.length === 0) return;
    onSearch({ keywords: keywords.trim(), naicsCode: naicsCode || null, states: selectedStates });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: Keywords + NAICS */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-mono text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: "var(--text-2)" }}>
            Search Keywords
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="cybersecurity, IT consulting, janitorial services..."
            disabled={searching}
            autoFocus
            className="w-full px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--text-2)"; e.target.style.background = "var(--surface)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "transparent"; }}
          />
        </div>
        <div className="w-80">
          <label className="block font-mono text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: "var(--text-2)" }}>
            Industry (NAICS)
          </label>
          <select
            value={naicsCode}
            onChange={(e) => setNaicsCode(e.target.value)}
            disabled={searching}
            className="w-full px-4 py-3 text-sm outline-none cursor-pointer appearance-none transition-all"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: naicsCode ? "var(--text-1)" : "var(--text-3)",
            }}
          >
            {NAICS_CODES.map((n) => (
              <option key={n.code} value={n.code}>
                {n.code ? `${n.code} — ${n.label}` : n.label}
              </option>
            ))}
          </select>
          {naicsCode && (
            <div className="font-mono text-[10px] mt-1" style={{ color: "var(--text-3)" }}>
              {NAICS_CODES.find((n) => n.code === naicsCode)?.desc}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Portals + Action */}
      <div className="flex items-end justify-between">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: "var(--text-2)" }}>
            Target Portals
            <span className="ml-2 normal-case tracking-normal" style={{ color: "var(--text-3)" }}>
              ({selectedStates.length} selected)
            </span>
          </label>
          <div className="flex gap-2">
            {STATES.map((s) => {
              const active = selectedStates.includes(s.code);
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => toggleState(s.code)}
                  disabled={searching}
                  className="group relative px-3 py-2.5 font-mono text-xs tracking-wider cursor-pointer transition-all"
                  style={{
                    background: active ? "var(--red-dim)" : "transparent",
                    border: `1px solid ${active ? "var(--red)" : "var(--border)"}`,
                    color: active ? "var(--red)" : "var(--text-2)",
                    boxShadow: active ? "inset 0 0 10px rgba(255,26,26,0.08)" : "none",
                  }}
                >
                  <div>{s.code}</div>
                  <div className="text-[9px] tracking-normal mt-0.5 opacity-50">{s.portal}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {searching ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-2.5 font-mono text-xs uppercase tracking-[0.1em] cursor-pointer transition-all"
              style={{
                background: "transparent",
                border: "1px solid var(--text-2)",
                color: "var(--text-2)",
              }}
            >
              ABORT
            </button>
          ) : (
            <button
              type="submit"
              disabled={!keywords.trim() || selectedStates.length === 0}
              className="px-8 py-2.5 font-mono text-xs uppercase tracking-[0.1em] cursor-pointer transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              style={{
                background: "transparent",
                border: "1px solid var(--red)",
                color: "var(--red)",
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.background = "var(--red)";
                  e.target.style.color = "black";
                  e.target.style.boxShadow = "var(--red-glow)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "var(--red)";
                e.target.style.boxShadow = "none";
              }}
            >
              INITIATE SCAN
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
