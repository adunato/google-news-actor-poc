# High-Level Design: Bounded Google News Request Adapter

> Change-specific design for Issue #3. This artifact constrains request behaviour while leaving numeric operational limits and code structure to the implementation plan.

**Artifact ID:** `issue-3-google-news-request-adapter-hld`<br>
**Status:** `Approved`<br>
**Owner:** `Development team (design author: Codex)`<br>
**Created / updated:** `2026-09-26`<br>
**GitHub Issue:** [#3 — Implement bounded Google News request adapter](https://github.com/adunato/google-news-actor-poc/issues/3)<br>
**Product Definition:** `docs/product.md` — PR-002, PR-006; Google News search and query controls<br>
**Architecture Definition:** `docs/architecture.md` — Query/request adapter; Google News integration; Reliability; Architecture Principles and Constraints<br>
**Traceability:** `docs/changes/3/implementation-plan.md` (next lifecycle artifact)

## 1. Summary

Issue #3 adds a lightweight request adapter that accepts one already-validated query and its language, country, and date-range controls, builds a Google News RSS search request, and returns the raw feed response for downstream parsing. It applies bounded time, response-size, and retry policies so a source outage or malformed response remains visible to the Actor without introducing browser automation, proxies, or paid data services.

## 2. Current State

The architecture defines a query/request adapter as the component that applies query, locale, country, and bounded recency controls to direct Google News feed/search requests. Current shared contracts define the supported date ranges (`any`, `1h`, `6h`, `1d`, `7d`, `30d`) and normalized input defaults (`en-US`, `US`, `7d`). The Actor runtime and request adapter are not implemented yet.

Direct feed requests were observed to return HTTP 200 XML for each supported date range. The observed request uses `https://news.google.com/rss/search` with `q`, `hl`, `gl`, and `ceid`; bounded ranges add the Google News `when:<range>` query operator. This is evidence of current upstream behaviour, not an official or stable Google API guarantee.

## 3. Requirements

### Functional Requirements

- Accept one validated query, language, country, and supported date range per adapter call.
- Construct a direct lightweight Google News RSS search request, applying language and country/edition controls.
- Map every supported date range to its observed request semantics, while treating `any` as an unbounded query with no `when:` operator.
- Return the upstream feed response in a form that lets the downstream parser inspect the raw XML and relevant response metadata.
- Make upstream failures observable to the caller and keep retries finite.

### Constraints and Important Conditions

- Encode user query text as a URL parameter so its content cannot alter the request structure.
- Use the existing validated input contract; do not add stricter language or country allowlists in this adapter.
- Keep access to one source through direct HTTP/feed access. Do not add browser scraping, publisher-page access, proxies, paid APIs, parsing, normalization, deduplication, or dataset delivery.
- Do not promise deterministic ranking, exhaustive results, stable undocumented query-operator behaviour, or support for every locale combination.
- Never include the full query or complete request URL in routine logs or terminal error messages.

## 4. Expected Outcome

### Before

There is no request adapter. The shared input layer can validate and normalize query controls, but nothing sends a Google News request or reports source failures.

### After

The Actor can request one feed using the validated query controls and provide the unparsed response to the parser. A successful response is bounded by timeout and size limits. A terminal HTTP, network, timeout, or response-size failure is returned as a typed/structured adapter error with safe diagnostic fields; it is not converted to an empty successful result. Verification demonstrates safe encoding, locale and recency mapping, bounded retry, and visible terminal failures.

## 5. Proposed Design

The adapter owns request URL construction and the bounded HTTP exchange. It receives one normalized query context, creates a URL using the platform URL API and `URLSearchParams`, and sends a direct GET to the Google News RSS search endpoint. The `q` value is the query unchanged as parameter data, with `when:<dateRange>` appended for the five bounded windows. For `any`, the `when:` operator is omitted. `hl` receives the language, `gl` receives the country, and `ceid` is formed as `<country>:<primary-language-subtag>` (for example `US:en`). The mapping follows observed feed behaviour and remains an upstream compatibility assumption.

The HTTP exchange has explicit connection/request timeout, overall elapsed-time, response-size, and attempt bounds. Concrete numeric values and backoff intervals are implementation-plan decisions. The retry policy retries transient network failures, timeouts, HTTP 408, HTTP 429, and HTTP 5xx only while both attempt and elapsed-time bounds permit. It uses bounded backoff with jitter; when `Retry-After` is valid, its delay is honored only up to the configured cap and remaining overall time. Other HTTP 4xx responses fail immediately. Caller cancellation is propagated and is never retried.

On a successful HTTP response, the adapter returns a response object containing the raw body, HTTP status, content type, and a safe source identifier (the endpoint identity without query parameters). It does not parse XML. A terminal error identifies a stable failure category, HTTP status when present, attempts used, and safe source identifier. Logs may include these safe fields and elapsed time, but not the query, request URL, or body.

### High-Level Flow

1. The Actor passes one query and its normalized language, country, and date range to the adapter.
2. The adapter constructs the RSS search URL with safely encoded query parameters and edition controls.
3. The adapter performs a bounded direct GET, retrying only specified transient failures within attempt and elapsed-time limits.
4. On success, it returns raw XML and response metadata to the downstream parser.
5. On terminal failure, it returns a structured error to the Actor so the run can record and surface the source failure.

## 6. Backend Changes

The change introduces request construction and bounded HTTP/feed retrieval behind the architecture's query/request adapter responsibility. Its output is an unparsed response; parsing, metadata normalization, result limits, deduplication, and dataset writes belong to later components/issues.

## 7. UI and User Experience Changes

No meaningful UI impact. Actor input remains as defined by the existing input contract. Adapter failures remain available to the Actor for run status and safe operational logging.

## 8. Data and State

No persistent state or migration is required. The adapter exchanges a per-request response object with raw body, status, content type, and safe source identifier. Query text exists only as request input and request parameter data; the adapter must not include it in routine logs or failure messages. Response-size limits apply before the complete body is accepted for downstream processing.

## 9. Interfaces and Integrations

- **Adapter input:** one validated query string, language string, country string, date-range enum, and cancellation signal if supported by the selected HTTP client.
- **Google News request:** direct GET to `/rss/search`; `q` contains the search expression, `hl` the language, `gl` the country, and `ceid` the country plus primary language subtag. A bounded date range adds `when:<range>` to the query expression; `any` omits it.
- **Adapter success output:** raw response body, HTTP status, content type, and safe source identifier, suitable for the parser in Issue #4.
- **Adapter failure output:** structured terminal error with category, optional HTTP status, attempts used, and safe source identifier.
- **Downstream boundary:** the adapter does not interpret feed items. Issue #4 owns feed parsing and normalization.

## 10. Error and Edge-Case Behaviour

- URL construction must preserve query text as a parameter value, including reserved URL characters and non-ASCII text.
- Retry only transient network errors/timeouts and HTTP 408, 429, and 5xx. Retry count, backoff, per-request timeout, overall deadline, and response-size maximum are all finite; implementation planning sets their numeric values.
- Respect `Retry-After` for 429/503 when parseable, capped by the configured maximum delay and remaining deadline. Invalid or excessive values fall back to the bounded policy.
- Fail immediately on other 4xx responses, unsupported date-range input reaching the adapter, caller cancellation, or a response exceeding the configured size limit. The normal validated-input path prevents unsupported date ranges.
- A successful status with an unexpected content type or empty body remains available to the parser with its metadata; parsing and feed-shape decisions belong to Issue #4. The adapter must not turn a non-success HTTP status into an empty feed.
- If the request reaches its overall deadline or exhausts its attempts, report the terminal failure category and attempts. Do not report query text or the full URL.
- Upstream behaviour can change. In particular, `when:` semantics and locale/edition combinations are observed behaviours rather than a documented compatibility promise.

## 11. Validation Considerations

- Verify `any` omits `when:` and every bounded range produces the intended `when:` value.
- Verify `hl`, `gl`, and `ceid` are derived correctly for representative locale/country combinations, including `en-US`/`US` and a locale with a different primary language.
- Verify reserved characters, spaces, and Unicode in a query remain encoded as parameter data and do not add or overwrite parameters.
- Verify a successful HTTP response returns raw body and response metadata without parsing.
- Verify retryable network errors, timeout, 408, 429, and 5xx stop at both configured bounds, including bounded `Retry-After` handling.
- Verify non-retryable 4xx, cancellation, oversize response, and exhausted retries surface observable structured failures.
- Verify logs and terminal error fields do not expose query text, full URL, or response body.
- Keep upstream-dependent checks deterministic with an injected/fake HTTP transport; a live feed smoke check may be used as supplemental evidence, not as the sole correctness check.

## 12. Open Questions

No outstanding design questions block implementation planning. Numeric timeout, total deadline, retry attempt/backoff, and response-size limits are implementation-plan decisions. The `ceid` construction and `when:` mapping are based on observed Google News feed behaviour and must be treated as compatibility assumptions.

## 13. Design Summary

- Build one direct RSS GET from normalized query controls using URL-safe parameter encoding.
- Map locale with `hl`, `gl`, and `ceid`; map bounded recency with an observed `when:` operator and omit it for `any`.
- Return raw feed response metadata to Issue #4 and keep all HTTP retry, timing, and size behaviour finite.
- Surface structured failures without logging query content, request URLs, or response bodies.
- Keep undocumented Google News semantics explicitly conditional on observed upstream behaviour.

### Approval

**Decision:** `Approve`<br>
**Rationale:** The design resolves the material request, locale/recency mapping, raw-response boundary, privacy-safe diagnostics, and bounded failure/retry behaviour needed to constrain implementation. `Approved` records design readiness for the next lifecycle step; it does not assert a separate project-owner sign-off. Upstream mapping details remain documented compatibility assumptions.<br>
**Required follow-up before implementation planning/development:** `Create the Issue #3 implementation plan and select numeric timeout, deadline, retry/backoff, and response-size bounds.`

### Completion contract

This HLD is ready to constrain downstream planning and implementation. Numeric operational values are intentionally deferred to the implementation plan; no unresolved behavioural design question remains.
