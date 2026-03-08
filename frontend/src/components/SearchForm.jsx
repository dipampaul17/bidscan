import { useState } from "react";

const STATES = [
  { code: "CA", name: "California", portal: "Cal eProcure" },
  { code: "TX", name: "Texas", portal: "TxSmartBuy" },
  { code: "NY", name: "New York", portal: "NYS Contract Reporter" },
  { code: "FL", name: "Florida", portal: "MyFloridaMarketPlace" },
  { code: "IL", name: "Illinois", portal: "BidBuy" },
];

const NAICS_CODES = [
  { code: "", label: "All categories" },
  { code: "541512", label: "541512 — Computer Systems Design" },
  { code: "541511", label: "541511 — Custom Programming" },
  { code: "541519", label: "541519 — Other Computer Related" },
  { code: "541611", label: "541611 — Management Consulting" },
  { code: "541330", label: "541330 — Engineering Services" },
  { code: "236220", label: "236220 — Commercial Construction" },
  { code: "561210", label: "561210 — Facilities Support" },
  { code: "561720", label: "561720 — Janitorial Services" },
  { code: "561612", label: "561612 — Security Guards" },
  { code: "511210", label: "511210 — Software Publishers" },
  { code: "518210", label: "518210 — Data Processing & Hosting" },
  { code: "541690", label: "541690 — Scientific & Technical Consulting" },
  { code: "621111", label: "621111 — Physician Offices" },
  { code: "541110", label: "541110 — Legal Services" },
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

  const selectAll = () => setSelectedStates(STATES.map((s) => s.code));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keywords.trim() || selectedStates.length === 0) return;
    onSearch({ keywords: keywords.trim(), naicsCode: naicsCode || null, states: selectedStates });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        {/* Top row: keywords + NAICS */}
        <div className="flex gap-4 mb-5">
          <div className="flex-1">
            <label className="block text-[11px] text-zinc-500 uppercase tracking-widest font-medium mb-2">
              Search Keywords
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="IT consulting, cybersecurity, janitorial services..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
              disabled={searching}
              autoFocus
            />
          </div>
          <div className="w-72 shrink-0">
            <label className="block text-[11px] text-zinc-500 uppercase tracking-widest font-medium mb-2">
              NAICS Code
            </label>
            <select
              value={naicsCode}
              onChange={(e) => setNaicsCode(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[15px] text-zinc-300 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer transition-all"
              disabled={searching}
            >
              {NAICS_CODES.map((n) => (
                <option key={n.code} value={n.code}>{n.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Portals */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">
              State Portals
            </label>
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors"
              disabled={searching}
            >
              Select all
            </button>
          </div>
          <div className="flex gap-2">
            {STATES.map((s) => {
              const active = selectedStates.includes(s.code);
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => toggleState(s.code)}
                  disabled={searching}
                  className={`flex-1 py-3 px-4 rounded-xl text-left transition-all ${
                    active
                      ? "bg-blue-500/10 border-blue-500/30 border text-blue-300"
                      : "bg-white/[0.02] border border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.12]"
                  }`}
                >
                  <div className="text-sm font-semibold">{s.code}</div>
                  <div className="text-[11px] opacity-60 mt-0.5">{s.portal}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          {searching ? (
            <button
              type="button"
              onClick={onCancel}
              className="h-12 px-8 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-all"
            >
              Cancel Search
            </button>
          ) : (
            <button
              type="submit"
              disabled={!keywords.trim() || selectedStates.length === 0}
              className="h-12 px-8 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-400/30"
            >
              Scan {selectedStates.length} portal{selectedStates.length !== 1 ? "s" : ""}
            </button>
          )}
          {selectedStates.length === 0 && !searching && (
            <span className="text-xs text-zinc-600">Select at least one portal to scan</span>
          )}
        </div>
      </div>
    </form>
  );
}
