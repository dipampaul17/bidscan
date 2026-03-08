import { useState } from "react";

const STATES = [
  { code: "CA", name: "California", portal: "Cal eProcure" },
  { code: "TX", name: "Texas", portal: "TxSmartBuy" },
  { code: "NY", name: "New York", portal: "NYS Contract Reporter" },
  { code: "FL", name: "Florida", portal: "MyFloridaMarketPlace" },
  { code: "IL", name: "Illinois", portal: "BidBuy" },
];

const NAICS_CODES = [
  { code: "", label: "Any" },
  { code: "541512", label: "541512" },
  { code: "541511", label: "541511" },
  { code: "541519", label: "541519" },
  { code: "541611", label: "541611" },
  { code: "541330", label: "541330" },
  { code: "236220", label: "236220" },
  { code: "238210", label: "238210" },
  { code: "561210", label: "561210" },
  { code: "561720", label: "561720" },
  { code: "561612", label: "561612" },
  { code: "511210", label: "511210" },
  { code: "518210", label: "518210" },
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
    <form onSubmit={handleSubmit} className="grid grid-cols-[2fr_1fr_auto_auto] gap-4 items-end">
      {/* Keywords */}
      <div>
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.15em] mb-2" style={{ color: "var(--text-2)" }}>
          Search Query
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="E.g. cybersecurity, IT consulting, janitorial..."
          disabled={searching}
          autoFocus
          className="w-full px-4 py-3.5 text-base outline-none transition-all"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-1)",
            fontFamily: "var(--sans)",
          }}
          onFocus={(e) => { e.target.style.borderColor = "var(--text-2)"; e.target.style.background = "var(--surface)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "transparent"; }}
        />
      </div>

      {/* NAICS */}
      <div>
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.15em] mb-2" style={{ color: "var(--text-2)" }}>
          NAICS Code
        </label>
        <select
          value={naicsCode}
          onChange={(e) => setNaicsCode(e.target.value)}
          disabled={searching}
          className="w-full px-4 py-3.5 text-base outline-none cursor-pointer appearance-none transition-all"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: naicsCode ? "var(--text-1)" : "var(--text-3)",
            fontFamily: "var(--mono)",
          }}
        >
          {NAICS_CODES.map((n) => (
            <option key={n.code} value={n.code}>{n.label}</option>
          ))}
        </select>
      </div>

      {/* State chips */}
      <div>
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.15em] mb-2" style={{ color: "var(--text-2)" }}>
          Portals
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
                className="px-3 py-3 font-mono text-xs tracking-wider cursor-pointer transition-all"
                style={{
                  background: active ? "var(--red-dim)" : "transparent",
                  border: `1px solid ${active ? "var(--red)" : "var(--border)"}`,
                  color: active ? "var(--red)" : "var(--text-2)",
                  boxShadow: active ? "inset 0 0 10px rgba(255,26,26,0.1)" : "none",
                }}
              >
                {s.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action */}
      <div className="flex flex-col justify-end">
        <label className="block font-mono text-[0.65rem] uppercase tracking-[0.15em] mb-2 opacity-0">
          Action
        </label>
        {searching ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] cursor-pointer transition-all"
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
            className="px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] cursor-pointer transition-all disabled:opacity-20 disabled:cursor-not-allowed"
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
            SCAN
          </button>
        )}
      </div>
    </form>
  );
}
