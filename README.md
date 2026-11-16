# dsarguide

Statutory DSAR and breach guidance, from your own machine's tool list. dsarguide is a local forwarding client for the hosted Double AIgents DSAR MCP service: it answers `tools/list` locally from the captured tool definitions and forwards every call to the service, returning the answers exactly as the service sends them back.

The built surface covers DSAR response deadlines and fixed-price quotes, breach notification clocks and breach triage, DSAR letter templates and search checklists, AI-tool DPIA and EU AI Act screening, HR record retention periods, service information, and a scoping helper that composes a prefilled email without sending or storing anything. Nothing is cached, stored or computed locally — the package is a pipe, not a law firm. All guidance is general information, not legal advice.

This is a full-surface rebuild: all 10 captured tools are built here, with no omissions.

## The tools

- **`dsar_deadline`** — Statutory deadline for answering a data subject access request in the UK, EU/EEA or Switzerland, with the applicable rule and extension position. `jurisdiction` and `received_date` are required.
- **`dsar_quote`** — Fixed price for preparing a DSAR response, by pack size in pages after de-duplication, plus the retainer price. `pages` is required.
- **`dsar_service_info`** — What the DSAR service covers: scoping, collection guidance, de-duplication, redaction, exemption recommendations, reviews, delivery, data handling, jurisdictions and partners. No parameters.
- **`dsar_request_scoping`** — How to start free scoping, returning a prefilled email (mailto URL). Sends nothing and stores nothing. `organisation`, `contact_name`, `contact_email`, `jurisdiction` and `date_received` are required.
- **`breach_clock`** — When a personal data breach must be notified to the regulator: 72 hours from awareness in the UK and EU/EEA, "as soon as possible" in Switzerland. `jurisdiction` and `aware_at` are required.
- **`dsar_letter_template`** — Plain-text letter template for an acknowledgement, extension of time or clarification request, under UK, EU/EEA or Swiss law. `kind` and `jurisdiction` are required.
- **`breach_triage`** — A likely-reportability view on a personal data breach, following ICO and EDPB guidance, with the notification deadline. All seven fields are required.
- **`ai_tool_check`** — Screens a planned AI tool use: DPIA likelihood, EU AI Act risk flags and automated-decision rules, with sources. All eight fields are required.
- **`hr_retention`** — Recommended retention period for a common UK HR record, whether statutory or recommended, and the source. `record_type` is required.
- **`dsar_search_checklist`** — Where to search when answering a subject access request, with search-term tips and the search standard. `organisation_type` is required.

## Install and run

As an MCP server via npm:

```bash
npx -y @reneturcios/dsarguide mcp
```

MCP client configuration:

```json
{
  "mcpServers": {
    "dsarguide": {
      "command": "npx",
      "args": ["-y", "@reneturcios/dsarguide", "mcp"]
    }
  }
}
```

As a container:

```bash
docker run -i ghcr.io/cloudcorprecords/dsarguide
docker run --rm ghcr.io/cloudcorprecords/dsarguide dsar_quote '{"pages":250}'
```

## CLI

One binary serves both the command line and the MCP server. Each tool is a subcommand taking a single JSON string with that tool's arguments:

```bash
dsarguide dsar_deadline '{"jurisdiction":"UK","received_date":"2026-10-17"}'
dsarguide breach_clock '{"jurisdiction":"EU","aware_at":"2026-10-17T09:30:00+01:00"}'
dsarguide hr_retention '{"record_type":"payroll_paye"}'
dsarguide --version
```

Exit codes: `0` when the forwarded call succeeds, `1` when the upstream result is an error, and `2` for usage problems such as an unknown subcommand or a malformed JSON argument.

## Configuration

- `DSAR_MCP_URL` — Overrides the upstream endpoint. The default is the pinned hosted endpoint, `https://www.doubleaigents.com/api/mcp`. (The override variable is a reconstruction added by this rebuild.)

The upstream registry record declares no headers, so no authentication header is ever sent; the tool surface was captured keyless.

Upstream failures — a JSON-RPC error from the service, a non-2xx response, an unreadable body, or a request that fails outright — are reported to the caller as an error result whose text starts with `dsarguide error:`.

## How forwarding works

The first forwarded call opens a session: an `initialize` request (protocol version `2025-03-26`), followed by a `notifications/initialized` notification, then the `tools/call` itself. If the service answers the initialize request with an `Mcp-Session-Id` header, that value is carried on every later request, and the open session is reused for the rest of the process. Replies are accepted either as plain JSON or as server-sent events. Successful results pass through verbatim, including any `isError` flag and any extra fields the service includes.

## Development

```bash
npm install
npm run build   # tsc -> dist/ (dist/cli.js is the bin)
npm test        # tsx --test test/*.test.ts — stubbed upstream, no network
npm run dev     # run the CLI from source
```

The test suite checks the served tool list against the captured surface, exercises the session handshake and its reuse, verifies that no `Authorization` header is ever sent, and verifies that arguments go upstream untouched and results come back untouched.

## License

MIT — see `LICENSE`. Copyright (c) 2026 Rene Turcios.
