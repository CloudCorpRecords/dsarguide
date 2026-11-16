# BUILD REPORT — dsarguide

Clean-room rebuild of `com.doubleaigents.www/dsar` v1.2.0
(remote-only MCP server at `https://www.doubleaigents.com/api/mcp`), built
2026-10-28 as a forwarding client. Package: `@reneturcios/dsarguide`
0.1.0, registry name `io.github.CloudCorpRecords/dsarguide`.

## Surface built

Full surface: **10 of 10 captured tools built**, no omissions.

| Tool | Required fields as served |
|------|---------------------------|
| `dsar_deadline` | `jurisdiction`, `received_date` |
| `dsar_quote` | `pages` |
| `dsar_service_info` | NO `required` key in the capture — served verbatim, none invented |
| `dsar_request_scoping` | `organisation`, `contact_name`, `contact_email`, `jurisdiction`, `date_received` |
| `breach_clock` | `jurisdiction`, `aware_at` |
| `dsar_letter_template` | `kind`, `jurisdiction` |
| `breach_triage` | `jurisdiction`, `aware_at`, `people_affected`, `special_category`, `recipient`, `recoverable`, `encrypted` |
| `ai_tool_check` | `use_case`, `processes_personal_data`, `special_category`, `employees_or_candidates`, `automated_decisions_with_significant_effect`, `new_technology`, `large_scale`, `jurisdiction` |
| `hr_retention` | `record_type` |
| `dsar_search_checklist` | `organisation_type` |

Each served tool carries exactly the keys `name`, `title`,
`description`, `inputSchema`, exactly as captured. The tool literals
were generated programmatically from
`harness/fixtures/dsar-tools-original.json` by the script at
`/tmp/b44-dsarguide-scratch/gen.py` (parse + re-serialise into
`src/forward.ts`) — never retyped — and a post-generation check (the
registration-integrity test suite, plus the parity harness) confirmed
the served literals deep-equal the fixture's 10 tool objects, in
order. Tools are registered via the MCP SDK low-level Server API
(`ListToolsRequestSchema` / `CallToolRequestSchema` handlers), not
McpServer+zod.

## Fixture conflicts

**None.** The spec and the fixture agree on all 10 tools' names,
titles, descriptions, required fields (including the absence of a
`required` key on `dsar_service_info`) and property shapes.

## Labelled reconstructions (from the spec's Wire section)

- Upstream endpoint pinned: `https://www.doubleaigents.com/api/mcp`.
- Env override `DSAR_MCP_URL` — labelled reconstruction.
- The registry record declares NO headers on the remote: no auth
  header is ever sent. Tests assert that no `Authorization` header is
  sent under any environment — including with key-like env vars
  (`DSAR_API_KEY`, `API_KEY`, `AUTHORIZATION`) set — and that no
  `X-API-Key` header is ever sent; upstream requests carry only
  `Content-Type`, `Accept` and, when issued, `Mcp-Session-Id`.
- Error rendering `dsarguide error:` text for upstream failures —
  labelled reconstruction.
- Upstream results pass through verbatim, including `isError` and
  extra fields. tools/call is forwarded as streamable-HTTP JSON-RPC:
  initialize (protocolVersion `2025-03-26`) →
  notifications/initialized → tools/call, honouring `Mcp-Session-Id`
  when issued; plain-JSON and SSE replies are both parsed. The
  forwarding core takes an injectable fetch; tests stub the
  upstream — no live network calls in tests.

## Deviations

None.

## Lockfile

- Route: generated clean from birth in the build dir with no
  `node_modules` and no pre-existing lockfile:
  `npm install --package-lock-only --ignore-scripts --offline` (Route 3).
- Parses as JSON; `name` == `@reneturcios/dsarguide`.
- Package entries: **128**.
- sha256: `e2abe2947a4b4860e27020c97e6d336474469a6fb2461317000ab0866206e6e5`
  (re-verified unchanged after the subsequent offline `npm install`).

## server.json

- Description exactly: "DSAR deadlines, breach clocks and triage,
  AI-tool checks, HR retention and letter templates." — **92 characters**.
- npm package entry carries `"version": "0.1.0"`; the OCI entry
  (`ghcr.io/cloudcorprecords/dsarguide:0.1.0`) carries **no**
  `version` field. Both entries carry packageArguments
  `[{type: positional, value: mcp}]` and transport stdio. Dockerfile
  (node:20-alpine, both stages) carries the label
  `io.modelcontextprotocol.server.name="io.github.CloudCorpRecords/dsarguide"`.
  Container workflow `IMAGE` is `ghcr.io/cloudcorprecords/dsarguide`
  and its smoke test asserts the server name `dsarguide`.

## Verification (all run 2026-10-28)

1. `npx tsc --noEmit` → exit 0.
2. `npm run build` → exit 0; real `dist/` produced (cli, forward,
   index, mcp, types — .js, .d.ts, .js.map each).
3. `node dist/cli.js --version` → `0.1.0`.
4. `npm test` → **51 tests, 51 pass, 0 fail** (registration-integrity
   suite deep-equals the served tools/list against the fixture's 10
   tools, plus session handling/reuse, env override, the
   no-Authorization-header assertions under any environment, verbatim
   argument forwarding and result pass-through including upstream
   isError, SSE parsing, error rendering, MCP-layer validation, and
   CLI behaviour).
5. Parity: `python3 /home/hatch/workspace/mcp-rebuild-100/harness/parity.py --original /home/hatch/workspace/mcp-rebuild-100/harness/fixtures/dsar-tools-original.json --rebuild "stdio:node /home/hatch/workspace/mcp-rebuild-100/builds/dsarguide/dist/cli.js mcp" --out /home/hatch/workspace/mcp-rebuild-100/builds/dsarguide/parity-out` → **verdict PASS, parity 100.0**
   (10/10 identical, 0 missing, 0 extra, no schema diffs). Output in
   `parity-out/`.
