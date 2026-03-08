"""BidScan — State & local procurement intelligence via web agents."""

from dotenv import load_dotenv
load_dotenv()

import os
import json
import asyncio
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from schemas import SearchRequest, PortalEvent, PortalStatus
from portals import PORTALS
from tinyfish import crawl_portal


@asynccontextmanager
async def lifespan(app: FastAPI):
    key = os.getenv("TINYFISH_API_KEY", "")
    if not key:
        print("WARNING: TINYFISH_API_KEY not set. API calls will fail.")
    else:
        print(f"TinyFish API key loaded ({key[:12]}...)")
    print(f"Portals configured: {', '.join(PORTALS.keys())}")
    yield


app = FastAPI(
    title="BidScan",
    description="State & local procurement intelligence",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "portals": list(PORTALS.keys())}


@app.get("/portals")
async def list_portals():
    return [
        {
            "state_code": p.state_code,
            "state_name": p.state_name,
            "portal_name": p.portal_name,
            "url": p.url,
        }
        for p in PORTALS.values()
    ]


@app.get("/search")
async def search(
    keywords: str = Query(..., min_length=1),
    naics_code: str | None = Query(None),
    states: str = Query(..., description="Comma-separated state codes"),
):
    """
    SSE endpoint. Fires TinyFish agents in parallel, streams live status updates.
    """
    state_list = [s.strip().upper() for s in states.split(",") if s.strip()]
    selected = {code: PORTALS[code] for code in state_list if code in PORTALS}

    if not selected:
        return {"error": f"No valid portals. Available: {list(PORTALS.keys())}"}

    async def event_stream():
        t0 = time.time()
        event_queue: asyncio.Queue[PortalEvent | None] = asyncio.Queue()

        # Callback: push events into queue as they happen in real-time
        async def on_event(event: PortalEvent):
            await event_queue.put(event)

        # Emit initial idle status for all portals
        for code, portal in selected.items():
            event = PortalEvent(
                portal=portal.portal_name,
                state=code,
                status=PortalStatus.IDLE,
                message="Queued",
                elapsed_seconds=0,
            )
            yield f"data: {event.model_dump_json()}\n\n"

        # Fire all portal crawls in parallel with real-time callbacks
        async def run_portal(code, portal):
            try:
                await crawl_portal(portal, keywords, naics_code, event_callback=on_event)
            except Exception as e:
                await on_event(PortalEvent(
                    portal=portal.portal_name,
                    state=code,
                    status=PortalStatus.ERROR,
                    message=str(e)[:200],
                    elapsed_seconds=round(time.time() - t0, 1),
                ))

        tasks = [
            asyncio.create_task(run_portal(code, portal))
            for code, portal in selected.items()
        ]

        # Sentinel: when all tasks done, push None to signal end
        async def wait_all():
            await asyncio.gather(*tasks, return_exceptions=True)
            await event_queue.put(None)

        asyncio.create_task(wait_all())

        # Stream events as they arrive
        while True:
            event = await event_queue.get()
            if event is None:
                break
            yield f"data: {event.model_dump_json()}\n\n"

        # Final summary
        total_elapsed = round(time.time() - t0, 1)
        yield f"data: {json.dumps({'type': 'DONE', 'elapsed_seconds': total_elapsed, 'portals_searched': len(selected)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
