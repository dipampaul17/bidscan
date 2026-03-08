"""TinyFish API wrapper — fires web agents against procurement portals.

TinyFish SSE event types:
  STARTED       — {type, runId, timestamp}
  STREAMING_URL — {type, runId, streamingUrl, timestamp}
  PROGRESS      — {type, runId, purpose, timestamp}
  HEARTBEAT     — {type, timestamp}
  COMPLETE      — {type, runId, status, resultJson, error, help_url, help_message, timestamp}
                  status: COMPLETED | FAILED | CANCELLED

Fallback: GET /v1/runs/{runId} if stream drops before COMPLETE.
"""

import os
import json
import asyncio
import time
import hashlib
import logging
from datetime import datetime

import aiohttp

from schemas import BidResult, PortalEvent, PortalStatus
from portals import PortalConfig

log = logging.getLogger("bidscan")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s", force=True)

TINYFISH_SSE_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"
TINYFISH_RUN_URL = "https://agent.tinyfish.ai/v1/runs"
TINYFISH_API_KEY = os.getenv("TINYFISH_API_KEY", "")


def _build_goal(portal: PortalConfig, keywords: str, naics_code: str | None) -> str:
    naics = naics_code or "N/A (skip this filter)"
    return portal.goal_template.format(keywords=keywords, naics_code=naics)


def _make_bid_id(state: str, title: str, sol_num: str | None) -> str:
    raw = f"{state}-{sol_num or title}"
    return f"bidscan-{state.lower()}-{hashlib.md5(raw.encode()).hexdigest()[:8]}"


def _parse_days_remaining(deadline: str | None) -> int | None:
    if not deadline:
        return None
    clean = deadline.strip().split(" at ")[0].split(" ET")[0].split(" EST")[0].split(" PST")[0].split(" CT")[0].split(" CST")[0]
    for fmt in [
        "%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%B %d, %Y", "%b %d, %Y",
        "%b. %d, %Y", "%d-%b-%Y", "%d %B %Y", "%m-%d-%Y",
    ]:
        try:
            dt = datetime.strptime(clean.strip()[:20], fmt)
            return max((dt - datetime.now()).days, 0)
        except ValueError:
            continue
    return None


def _compute_match_score(result: dict, keywords: str, naics_code: str | None) -> tuple[float, list[str]]:
    score = 0.0
    reasons = []
    kw_list = [k.strip().lower() for k in keywords.split() if len(k.strip()) > 2]
    text = f"{result.get('title', '')} {result.get('description', '')} {result.get('category', '')}".lower()

    if kw_list:
        hits = [kw for kw in kw_list if kw in text]
        if hits:
            score += 0.6 * (len(hits) / len(kw_list))
            for h in hits:
                reasons.append(f"keyword: {h}")

    if naics_code and naics_code in (result.get("category") or ""):
        score += 0.2
        reasons.append(f"NAICS: {naics_code}")

    days = _parse_days_remaining(result.get("deadline"))
    if days is not None and days > 7:
        score += 0.1
        reasons.append(f"{days}d remaining")

    if result.get("set_aside"):
        score += 0.1
        reasons.append(f"set-aside: {result['set_aside']}")

    return round(min(score, 1.0), 2), reasons


def _extract_json_from_text(text: str) -> list[dict] | None:
    """Pull a JSON array out of potentially messy agent output."""
    text = text.strip()

    # Strip markdown code fences
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            cleaned = part.strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
            if cleaned.startswith("["):
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError:
                    pass

    # Direct parse
    if text.startswith("["):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    # Find outermost [ ... ]
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    # Single object
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            obj = json.loads(text[start : end + 1])
            if isinstance(obj, dict) and ("title" in obj or "solicitation_number" in obj):
                return [obj]
        except json.JSONDecodeError:
            pass

    return None


def _parse_result_json(rj) -> list[dict] | None:
    """Parse resultJson from TinyFish which can be str, list, dict, or nested."""
    if isinstance(rj, list):
        return rj
    if isinstance(rj, dict):
        # Sometimes resultJson wraps the array: {"results": [...]} or {"data": [...]}
        for key in ("result", "results", "data", "opportunities", "bids", "items"):
            if key in rj and isinstance(rj[key], list):
                return rj[key]
        # Or it's a single result
        if "title" in rj or "solicitation_number" in rj:
            return [rj]
        return None
    if isinstance(rj, str):
        return _extract_json_from_text(rj)
    return None


def _clean_na(val: str | None) -> str | None:
    """Treat 'N/A', 'n/a', 'None', empty string as None."""
    if not val:
        return None
    if val.strip().lower() in ("n/a", "na", "none", "null", "--", "-", ""):
        return None
    return val.strip()


def _build_bids(raw_results: list[dict], portal: PortalConfig, keywords: str, naics_code: str | None) -> list[BidResult]:
    bids = []
    for i, r in enumerate(raw_results[:20]):
        if not isinstance(r, dict):
            continue
        if not r.get("title") and not r.get("solicitation_number"):
            continue
        # Clean N/A values before scoring
        for k in ("estimated_value", "set_aside", "category", "posted_date", "deadline", "agency", "description"):
            if k in r:
                r[k] = _clean_na(r[k])
        score, reasons = _compute_match_score(r, keywords, naics_code)
        bids.append(BidResult(
            id=_make_bid_id(portal.state_code, r.get("title", f"bid-{i}"), r.get("solicitation_number")),
            source_portal=f"{portal.state_name} ({portal.portal_name})",
            source_state=portal.state_code,
            title=r.get("title", "Untitled Opportunity"),
            solicitation_number=r.get("solicitation_number"),
            agency=r.get("agency"),
            posted_date=r.get("posted_date"),
            deadline=r.get("deadline"),
            days_remaining=_parse_days_remaining(r.get("deadline")),
            estimated_value=r.get("estimated_value"),
            set_aside=r.get("set_aside"),
            category=r.get("category"),
            description=(r.get("description") or "")[:250] or None,
            source_url=r.get("source_url"),
            match_score=score,
            match_reasons=reasons,
        ))
    bids.sort(key=lambda b: b.match_score, reverse=True)
    return bids


async def _poll_run_result(run_id: str) -> list[dict] | None:
    """Fallback: poll GET /v1/runs/{id} if SSE stream ended without COMPLETE."""
    headers = {"X-API-Key": TINYFISH_API_KEY}
    timeout = aiohttp.ClientTimeout(total=15)

    for attempt in range(12):  # poll up to 12 times, 10s apart = 2 min max
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(f"{TINYFISH_RUN_URL}/{run_id}", headers=headers) as resp:
                    if resp.status != 200:
                        log.warning(f"Poll run {run_id}: HTTP {resp.status}")
                        return None
                    data = await resp.json()
                    status = data.get("status", "")
                    log.info(f"Poll run {run_id}: status={status}")

                    if status == "COMPLETED":
                        rj = data.get("result") or data.get("resultJson")
                        return _parse_result_json(rj)
                    elif status in ("FAILED", "CANCELLED"):
                        log.warning(f"Run {run_id} {status}: {data.get('error', {})}")
                        return None
                    # Still RUNNING or PENDING — wait and retry
        except Exception as e:
            log.warning(f"Poll error for {run_id}: {e}")

        if attempt < 11:
            await asyncio.sleep(10)

    return None


async def crawl_portal(
    portal: PortalConfig,
    keywords: str,
    naics_code: str | None,
    event_callback=None,
):
    """Fire a TinyFish agent at a single portal with real-time event streaming."""
    events: list[PortalEvent] = []
    t0 = time.time()

    def elapsed():
        return round(time.time() - t0, 1)

    async def emit(event: PortalEvent):
        events.append(event)
        if event_callback:
            await event_callback(event)

    await emit(PortalEvent(
        portal=portal.portal_name, state=portal.state_code,
        status=PortalStatus.CONNECTING,
        message=f"Connecting to {portal.portal_name}...",
        elapsed_seconds=elapsed(),
    ))

    goal = _build_goal(portal, keywords, naics_code)
    payload = {"url": portal.url, "goal": goal}
    headers = {"X-API-Key": TINYFISH_API_KEY, "Content-Type": "application/json"}

    run_id = None
    result_json = None
    full_text = ""
    got_complete = False

    try:
        timeout = aiohttp.ClientTimeout(total=420, sock_read=420)  # 7 min — state portals are slow
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(TINYFISH_SSE_URL, json=payload, headers=headers) as resp:
                if resp.status != 200:
                    body = await resp.text()
                    await emit(PortalEvent(
                        portal=portal.portal_name, state=portal.state_code,
                        status=PortalStatus.ERROR,
                        message=f"API error {resp.status}: {body[:200]}",
                        elapsed_seconds=elapsed(),
                    ))
                    return events

                last_purpose = ""
                async for raw_line in resp.content:
                    decoded = raw_line.decode("utf-8", errors="replace").strip()
                    if not decoded.startswith("data:"):
                        continue
                    data_str = decoded[5:].strip()
                    if not data_str:
                        continue

                    try:
                        data = json.loads(data_str)
                    except json.JSONDecodeError:
                        full_text += data_str
                        continue

                    etype = data.get("type", "")

                    if etype == "STARTED":
                        run_id = data.get("runId")
                        log.info(f"[{portal.state_code}] Agent started: {run_id}")
                        await emit(PortalEvent(
                            portal=portal.portal_name, state=portal.state_code,
                            status=PortalStatus.NAVIGATING,
                            message=f"Agent launched for {portal.state_name}",
                            elapsed_seconds=elapsed(),
                        ))

                    elif etype == "PROGRESS":
                        purpose = data.get("purpose", "")
                        if purpose and purpose != last_purpose:
                            last_purpose = purpose
                            extract_kws = ["extract", "collect", "read result", "scrape", "gather", "compile"]
                            is_extracting = any(kw in purpose.lower() for kw in extract_kws)
                            await emit(PortalEvent(
                                portal=portal.portal_name, state=portal.state_code,
                                status=PortalStatus.EXTRACTING if is_extracting else PortalStatus.NAVIGATING,
                                message=purpose[:200],
                                elapsed_seconds=elapsed(),
                            ))

                    elif etype == "COMPLETE":
                        got_complete = True
                        status = data.get("status", "")
                        log.info(f"[{portal.state_code}] COMPLETE status={status} keys={list(data.keys())}")

                        if status == "FAILED" or status == "CANCELLED":
                            err = data.get("error", "Agent failed")
                            log.warning(f"[{portal.state_code}] {status}: {err}")
                            await emit(PortalEvent(
                                portal=portal.portal_name, state=portal.state_code,
                                status=PortalStatus.ERROR,
                                message=f"{status}: {str(err)[:200]}",
                                elapsed_seconds=elapsed(),
                            ))
                            return events

                        # COMPLETED — parse resultJson
                        rj = data.get("resultJson")
                        log.info(f"[{portal.state_code}] resultJson type={type(rj).__name__}, preview={str(rj)[:500]}")
                        parsed = _parse_result_json(rj)
                        if parsed:
                            result_json = parsed

                        # Also check result field
                        r = data.get("result")
                        if r and result_json is None:
                            parsed2 = _parse_result_json(r)
                            if parsed2:
                                result_json = parsed2

                    elif etype == "HEARTBEAT" or etype == "STREAMING_URL":
                        pass  # ignore

        # Stream ended — if no COMPLETE event, poll the run
        if not got_complete and run_id:
            log.info(f"[{portal.state_code}] No COMPLETE event received, polling run {run_id}...")
            await emit(PortalEvent(
                portal=portal.portal_name, state=portal.state_code,
                status=PortalStatus.EXTRACTING,
                message="Waiting for agent to finish...",
                elapsed_seconds=elapsed(),
            ))
            polled = await _poll_run_result(run_id)
            if polled:
                result_json = polled

        # Also try parsing full_text if we still have no results
        if result_json is None and full_text:
            log.info(f"[{portal.state_code}] Trying to parse full_text ({len(full_text)} chars)")
            result_json = _extract_json_from_text(full_text)

        # Build bid results
        if result_json and isinstance(result_json, list):
            bids = _build_bids(result_json, portal, keywords, naics_code)
            log.info(f"[{portal.state_code}] Parsed {len(bids)} bids from {len(result_json)} raw results")
            await emit(PortalEvent(
                portal=portal.portal_name, state=portal.state_code,
                status=PortalStatus.COMPLETE,
                message=f"Found {len(bids)} opportunities",
                results=bids,
                elapsed_seconds=elapsed(),
            ))
        else:
            log.info(f"[{portal.state_code}] No parseable results. full_text={len(full_text)} chars, result_json={result_json}")
            await emit(PortalEvent(
                portal=portal.portal_name, state=portal.state_code,
                status=PortalStatus.COMPLETE,
                message="No opportunities found",
                results=[],
                elapsed_seconds=elapsed(),
            ))

    except asyncio.TimeoutError:
        # Try polling as fallback
        if run_id:
            polled = await _poll_run_result(run_id)
            if polled:
                bids = _build_bids(polled, portal, keywords, naics_code)
                await emit(PortalEvent(
                    portal=portal.portal_name, state=portal.state_code,
                    status=PortalStatus.COMPLETE,
                    message=f"Found {len(bids)} opportunities (recovered)",
                    results=bids,
                    elapsed_seconds=elapsed(),
                ))
                return events

        await emit(PortalEvent(
            portal=portal.portal_name, state=portal.state_code,
            status=PortalStatus.ERROR,
            message="Portal timed out after 420s",
            elapsed_seconds=elapsed(),
        ))
    except asyncio.CancelledError:
        await emit(PortalEvent(
            portal=portal.portal_name, state=portal.state_code,
            status=PortalStatus.ERROR,
            message="Search cancelled",
            elapsed_seconds=elapsed(),
        ))
    except Exception as e:
        log.exception(f"[{portal.state_code}] Unexpected error")
        await emit(PortalEvent(
            portal=portal.portal_name, state=portal.state_code,
            status=PortalStatus.ERROR,
            message=f"Error: {str(e)[:200]}",
            elapsed_seconds=elapsed(),
        ))

    return events
