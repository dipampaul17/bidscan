import { useState, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

export function useSearch() {
  const [portalStates, setPortalStates] = useState({});
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  const search = useCallback(({ keywords, naicsCode, states }) => {
    // Reset
    setResults([]);
    setDone(false);
    setElapsed(0);
    setSearching(true);

    const initialStates = {};
    states.forEach((s) => {
      initialStates[s] = { status: "idle", message: "Queued", results: [], elapsed: 0 };
    });
    setPortalStates(initialStates);

    // Timer
    const t0 = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - t0) / 1000).toFixed(1));
    }, 100);

    // Abort controller for cancellation
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const params = new URLSearchParams({
      keywords,
      states: states.join(","),
    });
    if (naicsCode) params.set("naics_code", naicsCode);

    fetch(`${API_BASE}/search?${params}`, {
      signal: abortRef.current.signal,
    })
      .then(async (response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const event = JSON.parse(raw);

              // Final DONE event
              if (event.type === "DONE") {
                setDone(true);
                setSearching(false);
                clearInterval(timerRef.current);
                setElapsed(event.elapsed_seconds);
                continue;
              }

              // Portal status update
              if (event.state && event.status) {
                setPortalStates((prev) => ({
                  ...prev,
                  [event.state]: {
                    status: event.status,
                    message: event.message || "",
                    results: event.results || prev[event.state]?.results || [],
                    elapsed: event.elapsed_seconds || 0,
                  },
                }));

                // Accumulate results
                if (event.results && event.results.length > 0) {
                  setResults((prev) => {
                    const existingIds = new Set(prev.map((r) => r.id));
                    const newResults = event.results.filter((r) => !existingIds.has(r.id));
                    const merged = [...prev, ...newResults];
                    merged.sort((a, b) => b.match_score - a.match_score);
                    return merged;
                  });
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      })
      .finally(() => {
        setSearching(false);
        setDone(true);
        clearInterval(timerRef.current);
      });
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setSearching(false);
    setDone(true);
    clearInterval(timerRef.current);
  }, []);

  return { portalStates, results, searching, elapsed, done, search, cancel };
}
