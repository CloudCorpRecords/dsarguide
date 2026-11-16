# Changelog

## 0.1.0 (2026-10-28)

- First release: a forwarding client for the hosted Double AIgents DSAR MCP server. All 10 captured tools are answered locally for tools/list, and every tools/call is forwarded upstream over a streamable-HTTP JSON-RPC session (initialize, notifications/initialized, tools/call, honouring the Mcp-Session-Id header when the upstream issues one).
- Tools: `dsar_deadline`, `dsar_quote`, `dsar_service_info`, `dsar_request_scoping`, `breach_clock`, `dsar_letter_template`, `breach_triage`, `ai_tool_check`, `hr_retention`, `dsar_search_checklist`. Full surface — no omissions.
- Upstream results pass through verbatim, including the isError flag; upstream failures surface as `dsarguide error:` text results.
- One bin serves the CLI (one subcommand per tool, plus `--version`) and the stdio MCP server (`mcp` subcommand). The upstream endpoint can be overridden via `DSAR_MCP_URL`. The upstream record declares no headers, so no auth header is ever sent.
