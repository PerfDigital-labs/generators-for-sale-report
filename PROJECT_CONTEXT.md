PROJECT: PD Client Reporting — Generators for Sale V1

PURPOSE

This project is for designing and implementing a custom interactive client-facing reporting dashboard for Performance Digital, beginning with Generators for Sale.

The frontend is hosted through GitHub Pages.

The reporting backend uses:

BigQuery = analytics and reporting layer
n8n = report API / orchestration layer
Supabase = future canonical client identity layer
GitHub Pages = interactive frontend

The V1 client is Generators for Sale.

The report must tell the campaign story:

1. Both markets together
2. Omaha individually
3. Kansas City individually
4. How channels/funnel stages contributed
5. Audience and CTV performance
6. Creative/ad performance
7. AI-generated insights based only on validated reporting data


WORKING ROLES

Alexis:
- BigQuery architecture
- data validation
- n8n/API implementation
- GitHub implementation
- frontend data wiring
- metric reconciliation
- production deployment

Paulo:
- client-facing report structure
- visual hierarchy
- storytelling
- chart/layout recommendations
- metric selection
- account-management perspective

ChatGPT:
- translate agreed reporting requirements into implementation
- provide exact SQL, JavaScript, HTML, CSS, BigQuery and n8n steps
- preserve validated metric definitions
- flag ambiguous data instead of guessing
- help reconcile report outputs against BigQuery


DATA RULES

BigQuery is the reporting source of truth for this dashboard.

Do not query Illumin directly from the browser.

GitHub Pages must not contain BigQuery, Illumin, n8n, or other private credentials.

The frontend consumes a controlled n8n JSON endpoint.

Do not invent metric definitions, client IDs, platform IDs, attribution rules, mappings, budgets, spend values, or conversion definitions.

Campaign totals are authoritative.

Audience and CTV dimensional tables are breakdowns and may have slight source-side undercoverage.

Do not force missing dimensional values into Unknown unless explicitly defined.

Do not join all dimensional tables into one giant fact table because this creates fanout.

Use stable IDs instead of campaign/client names whenever possible.

Raw platform spend should NOT currently be exposed in the client-facing report because client billing includes additional management fees and does not necessarily match Illumin raw media cost.

Financial metrics remain excluded until Performance Digital confirms the client-facing billing definition.


CURRENT V1 CLIENT

Advertiser:
Generators for Sale

Illumin advertiser_id:
35759


CURRENT MARKET / JOURNEY MAPPING

Omaha
journey_id = 53305

Kansas City
journey_id = 53313


CURRENT CAMPAIGN MAPPING

Omaha:
120797 = Upper Funnel - CTV
120801 = Middle Funnel - Native Display
120809 = Lower Funnel - Display

Kansas City:
120811 = Upper Funnel - CTV
120813 = Middle Funnel - Native Display
120815 = Lower Funnel - Display


CURRENT REPORTING TABLES

Authoritative campaign totals:
pd-client-analytics.client_reporting.illumin_campaign_daily_clean

Audience:
pd-client-analytics.client_reporting.illumin_age_daily
pd-client-analytics.client_reporting.illumin_gender_daily
pd-client-analytics.client_reporting.illumin_household_income_daily

CTV:
pd-client-analytics.client_reporting.illumin_ctv_network_daily

Additional CTV genre data has been discovered but is not yet confirmed as a completed production reporting table.


CURRENT CAMPAIGN API

An n8n workflow named:

GFS Report API V1

returns Generators campaign history.

Current payload includes:

client
freshness
campaign_daily

Campaign rows contain:

date
advertiser_id
advertiser
journey_id
journey_name
campaign_id
campaign_name
impressions
clicks
spend
conversions
primary_conv
secondary_conv
tertiary_conv

The endpoint currently supports frontend filtering by:

date
market
channel
campaign structure


CURRENT DASHBOARD

GitHub repo:
generators-for-sale-report

Current frontend includes:

Generators for Sale branding
Performance Digital branding
data freshness
Both Markets / Omaha / Kansas City selector
channel selector
start/end date
executive KPI cards
performance-over-time chart
Omaha vs Kansas City section
Print / Save PDF

Current KPIs include:

Impressions
Clicks
Conversions
CTR

Spend and CPM exist in the backend but should not automatically be shown client-facing until billing/reporting rules are confirmed.


REPORT DIRECTION

The report should eventually include:

Executive Overview
Performance Over Time
Full-Funnel / Campaign Journey
Omaha vs Kansas City
Channel Performance
Conversions
Audience
CTV and Video
Ad / Creative Breakdown
AI Insights

The Full-Funnel section should visually represent:

Upper Funnel — CTV / Awareness
→
Middle Funnel — Native Display / Engagement
→
Lower Funnel — Display / Conversion

Do not claim specific users moved between stages unless Illumin confirms that the stage advancement metrics represent true user-level progression.

The Illumin journey interface can inspire the visualization, but the client dashboard should be a cleaner Performance Digital presentation rather than a copy.


VIDEO METRICS CONFIRMED FROM ILLUMIN

videoStart
videoFirstQuartile
videoMidpoint
videoThirdQuartile
videoComplete

Desired BigQuery names:

video_start
video_first_quartile
video_midpoint
video_third_quartile
video_complete

Rates should be calculated in the reporting layer rather than stored:

25% rate = first quartile / video starts
50% rate = midpoint / video starts
75% rate = third quartile / video starts
completion rate = video complete / video starts

Illumin source video event counts may occasionally be slightly non-monotonic or video starts may slightly exceed impressions.

Do not clamp or alter those source counts.

Historical video backfill is not yet completed.


CREATIVE / AD REPORTING

Illumin exposes:

creativeId
creative
creativeType
creativeSize

A creative-level reporting table is planned but has not yet been validated or created.

Before building it, validate the natural source grain and video/conversion metric behavior at creative level.


CONVERSION DEFINITIONS

Primary, Secondary and Tertiary conversion counts are loaded and validated.

Their exact client-facing semantic definitions and attribution behavior are NOT yet considered final.

Do not publish explanatory client-facing definitions until confirmed with Illumin/account management.


AI INSIGHTS

AI should interpret calculated reporting results.

AI should not calculate authoritative campaign totals from raw platform rows.

BigQuery calculates.
AI explains.

AI should eventually answer:

How did the campaign perform overall?
How did Omaha perform?
How did Kansas City perform?
What were the main differences?
Which channels contributed most?
What changed over time?
Which audiences stood out?
How did CTV/video perform?
Which ads/creatives stood out?
What should the client know?

AI claims must be grounded in the selected report data.


PRINT / PDF

The interactive GitHub report must remain print-friendly.

Print / Save PDF should:

hide interactive controls
preserve client + Performance Digital branding
preserve charts
maintain readable section boundaries
avoid splitting important cards/charts across pages


DEVELOPMENT APPROACH

Work one logical step at a time.

Before adding a new report metric:
1. identify the source
2. validate its grain
3. reconcile it against authoritative totals where appropriate
4. confirm its business meaning
5. then expose it to the frontend

Never sacrifice data correctness for visual convenience.
