from dataclasses import dataclass


@dataclass
class PortalConfig:
    state_code: str
    state_name: str
    portal_name: str
    url: str
    goal_template: str  # f-string with {keywords} and {naics_code} placeholders
    notes: str = ""


# Each goal is hand-tuned for the portal's actual UI flow.
# These are the navigation instructions TinyFish agents follow.

PORTALS: dict[str, PortalConfig] = {
    "CA": PortalConfig(
        state_code="CA",
        state_name="California",
        portal_name="Cal eProcure",
        url="https://caleprocure.ca.gov/pages/Events-BS3/event-search.aspx",
        goal_template="""You are on the California Cal eProcure event/bid search page.

1. Look for the Event Name or keyword search field and type: {keywords}
2. Set the Event Status dropdown to "Posted" or "Open" if available.
3. If there is a UNSPSC or commodity code filter, enter: {naics_code}
4. Click the Search button and wait for results to load.
5. Extract up to 20 bid opportunities from the results table/list.

For each opportunity, extract these fields as a JSON array:
[{{
  "title": "bid/solicitation title",
  "solicitation_number": "solicitation or bid number",
  "agency": "issuing department or agency name",
  "posted_date": "date posted (any format)",
  "deadline": "submission deadline date and time",
  "estimated_value": "dollar amount if shown, null otherwise",
  "set_aside": "small business or other set-aside designation if shown",
  "category": "procurement category or commodity code",
  "description": "first 200 characters of the description or scope",
  "source_url": "direct URL link to this specific opportunity"
}}]

Return ONLY the JSON array. No explanatory text before or after.""",
        notes="Largest state procurement market. Dynamic JS filters, UNSPSC codes.",
    ),
    "TX": PortalConfig(
        state_code="TX",
        state_name="Texas",
        portal_name="ESBD",
        url="https://www.txsmartbuy.com/sp",
        goal_template="""You are on the Texas procurement search page (TxSmartBuy or ESBD).

1. Find the search or keyword input field and type: {keywords}
2. If there's a NIGP or category filter available, try entering: {naics_code}
3. Make sure to filter for OPEN or ACTIVE solicitations only if the option exists.
4. Click Search and wait for results.
5. Extract up to 20 bid opportunities from the results.

For each opportunity, extract as JSON array:
[{{
  "title": "bid title or description",
  "solicitation_number": "solicitation/RFP/IFB number",
  "agency": "issuing agency or department",
  "posted_date": "posting date",
  "deadline": "due date and time for submissions",
  "estimated_value": "dollar value if shown, null otherwise",
  "set_aside": "HUB or small business designation if shown",
  "category": "category or class-item code",
  "description": "brief description text (first 200 chars)",
  "source_url": "direct link to this opportunity"
}}]

Return ONLY the JSON array.""",
        notes="Second largest state. HUB (Historically Underutilized Business) set-asides.",
    ),
    "NY": PortalConfig(
        state_code="NY",
        state_name="New York",
        portal_name="NYS Contract Reporter",
        url="https://nyscr.ny.gov/Ads/Search",
        goal_template="""You are on the New York State Contract Reporter search page (nyscr.ny.gov).

1. Find the keyword/search input field and type: {keywords}
2. If there are category, classification, or NAICS filters, try using: {naics_code}
3. Filter to show only OPEN or ACTIVE advertisements if possible.
4. Click Search and wait for results to fully load.
5. If results are paginated, extract from the first 2 pages (up to 20 results total).

For each opportunity, extract as JSON array:
[{{
  "title": "opportunity title",
  "solicitation_number": "contract or solicitation ID",
  "agency": "issuing agency",
  "posted_date": "date posted or published",
  "deadline": "submission deadline",
  "estimated_value": "estimated value if shown",
  "set_aside": "MWBE or small business set-aside if shown",
  "category": "procurement category",
  "description": "description excerpt (first 200 chars)",
  "source_url": "direct link to opportunity detail page"
}}]

Return ONLY the JSON array.""",
        notes="Nested sub-portals. MWBE (Minority/Women-Owned) set-asides common.",
    ),
    "FL": PortalConfig(
        state_code="FL",
        state_name="Florida",
        portal_name="MyFloridaMarketPlace",
        url="https://vendor.myfloridamarketplace.com/search/bids",
        goal_template="""You are on the Florida MyFloridaMarketPlace vendor bid search page.

1. Find the search/keyword field and enter: {keywords}
2. Apply any available category or NAICS code filter: {naics_code}
3. Filter for OPEN or ACTIVE bids/solicitations if the option is available.
4. Search and wait for results to load completely.
5. Extract up to 20 opportunities from the results.

For each, return a JSON array:
[{{
  "title": "solicitation title",
  "solicitation_number": "bid or solicitation number",
  "agency": "issuing agency or department",
  "posted_date": "posted date",
  "deadline": "response due date",
  "estimated_value": "estimated value if visible",
  "set_aside": "certified minority/small business preference if shown",
  "category": "NIGP or category code",
  "description": "scope or description (first 200 chars)",
  "source_url": "link to opportunity details"
}}]

Return ONLY the JSON array.""",
        notes="Vendor portal navigation required. Growing market.",
    ),
    "IL": PortalConfig(
        state_code="IL",
        state_name="Illinois",
        portal_name="BidBuy",
        url="https://www.bidbuy.illinois.gov/bso/",
        goal_template="""You are on the Illinois BidBuy procurement portal.

1. Navigate to the bid/solicitation search if not already there.
2. Enter keywords in the search field: {keywords}
3. If commodity code or NAICS filters exist, enter: {naics_code}
4. Filter to OPEN solicitations if possible.
5. Run the search and wait for results.
6. Extract up to 20 opportunities from results.

Return as JSON array:
[{{
  "title": "solicitation title",
  "solicitation_number": "reference or bid number",
  "agency": "issuing agency",
  "posted_date": "publication date",
  "deadline": "closing date/time",
  "estimated_value": "value if shown",
  "set_aside": "BEP or small business set-aside if shown",
  "category": "commodity or category",
  "description": "description excerpt (first 200 chars)",
  "source_url": "direct link to this solicitation"
}}]

Return ONLY the JSON array.""",
        notes="BEP (Business Enterprise Program) set-asides. Modern-ish UI.",
    ),
}
