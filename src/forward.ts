/**
 * dsarguide core: a forwarding client for the hosted
 * Double AIgents DSAR MCP server.
 *
 * No DSAR calculation happens on this machine. tools/list
 * is answered from the literal definitions below, which
 * reproduce a live capture of the upstream server word
 * for word (name, title, description and inputSchema
 * exactly as captured; dsar_service_info carries no
 * `required` key in the capture, so none is served for
 * it). A tools/call travels upstream over a
 * streamable-HTTP JSON-RPC session: an initialize POST,
 * a notifications/initialized POST, then the tools/call
 * POST, carrying the Mcp-Session-Id response header on
 * later requests when the upstream issues one. The
 * session opens lazily on the first forwarded call and
 * is reused for the client's lifetime.
 *
 * The endpoint is pinned to https://www.doubleaigents.com/api/mcp
 * and may be replaced with the DSAR_MCP_URL
 * environment variable (that override is a labelled
 * reconstruction). The registry record declares NO
 * headers on the upstream remote, so no auth header is
 * ever sent, under any environment.
 *
 * A successful upstream result is returned exactly as
 * received, isError flag and extra fields included.
 * Failures — an upstream JSON-RPC error, a non-2xx
 * status, a body that cannot be parsed, or a fetch
 * that throws or times out — become an isError result
 * whose text begins with `dsarguide error:` (that
 * rendering is a labelled reconstruction). Replies may
 * be plain JSON or SSE (`data:` lines); the JSON-RPC
 * message whose id matches the request wins.
 *
 * FULL SURFACE: all 10 captured tools are built here;
 * nothing is omitted.
 */
import type {
  FetchFn,
  FetchResponseLike,
  ForwardDeps,
  ToolArgs,
  ToolDef,
  ToolResult,
} from "./types.js";

export const VERSION = "0.1.0";

export const DEFAULT_ENDPOINT_URL = "https://www.doubleaigents.com/api/mcp";

export const DEFAULT_TIMEOUT_MS = 30000;

export const PROTOCOL_VERSION = "2025-03-26";

/* ------------------------------------------------------------------ */
/* Tool definitions (tools/list literals, verbatim from the live       */
/* capture in harness/fixtures/dsar-tools-original.json;           */
/* generated programmatically by parsing and re-serialising the        */
/* fixture JSON, never retyped)                                        */
/* ------------------------------------------------------------------ */

export const TOOL_DEFS: ToolDef[] = [
  {
    "name": "dsar_deadline",
    "title": "DSAR response deadline",
    "description": "Calculate the statutory deadline for answering a data subject access request in the UK, the EU/EEA or Switzerland, with the rule that applies and the extension position. General information, not legal advice.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "jurisdiction": {
          "type": "string",
          "enum": [
            "UK",
            "EU",
            "CH"
          ],
          "description": "UK, EU (EU/EEA GDPR) or CH (Switzerland)."
        },
        "received_date": {
          "type": "string",
          "format": "date",
          "description": "ISO date the clock starts. For the UK, the later of receipt and receipt of any requested ID or fee."
        },
        "extended": {
          "type": "boolean",
          "description": "Also calculate the extended deadline where an extension is available."
        }
      },
      "required": [
        "jurisdiction",
        "received_date"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "dsar_quote",
    "title": "DSAR fixed-price quote",
    "description": "Fixed price from Double AIgents for preparing a DSAR response, by pack size in pages after de-duplication. Also gives the retainer price (15% off). Excludes VAT.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "pages": {
          "type": "integer",
          "minimum": 1,
          "description": "Number of pages after de-duplication."
        },
        "currency": {
          "type": "string",
          "enum": [
            "GBP",
            "EUR",
            "CHF"
          ],
          "default": "GBP",
          "description": "GBP (UK), EUR (EU/EEA) or CHF (Switzerland)."
        }
      },
      "required": [
        "pages"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "dsar_service_info",
    "title": "DSAR service information",
    "description": "What the Double AIgents DSAR service covers: scoping, collection guidance, de-duplication, redaction, exemption recommendations, two independent reviews, secure delivery, data handling, jurisdictions and partner arrangements.",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "additionalProperties": false
    }
  },
  {
    "name": "dsar_request_scoping",
    "title": "Start DSAR scoping",
    "description": "Explains how to start free scoping and returns a prefilled email (mailto URL) to james@doubleaigents.com. Sends nothing and stores nothing. Do not pass the requester's personal data or the request letter.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "organisation": {
          "type": "string",
          "maxLength": 200,
          "description": "The controller organisation that received the request."
        },
        "contact_name": {
          "type": "string",
          "maxLength": 120,
          "description": "Name of the person at the organisation handling the request (not the requester)."
        },
        "contact_email": {
          "type": "string",
          "format": "email",
          "maxLength": 254,
          "description": "Email of that person."
        },
        "jurisdiction": {
          "description": "Jurisdiction for the scoping guidance: UK, EU, or CH",
          "type": "string",
          "enum": [
            "UK",
            "EU",
            "CH"
          ]
        },
        "date_received": {
          "type": "string",
          "format": "date",
          "description": "ISO date the request was received."
        },
        "approx_volume": {
          "type": "string",
          "maxLength": 200,
          "description": "Optional rough volume, for example \"two mailboxes, about 3 years\"."
        }
      },
      "required": [
        "organisation",
        "contact_name",
        "contact_email",
        "jurisdiction",
        "date_received"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "breach_clock",
    "title": "Personal data breach notification clock",
    "description": "When a personal data breach must be notified to the regulator: 72 hours from awareness in the UK and EU/EEA (Art. 33), \"as soon as possible\" in Switzerland (revised FADP Art. 24). Gives the deadline, the rule, the processor and individual-notification position, and the facts the regulator will ask for. The controller decides whether to notify. General information, not legal advice.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "jurisdiction": {
          "type": "string",
          "enum": [
            "UK",
            "EU",
            "CH"
          ],
          "description": "UK, EU (EU/EEA GDPR) or CH (Switzerland)."
        },
        "aware_at": {
          "type": "string",
          "format": "date-time",
          "description": "ISO date and time, with time zone, when the controller became aware of the breach. Example: 2026-10-17T09:30:00+01:00."
        }
      },
      "required": [
        "jurisdiction",
        "aware_at"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "dsar_letter_template",
    "title": "DSAR letter template",
    "description": "Plain-text letter template, in British English with [placeholders], for an acknowledgement, an extension of time or a request for clarification of a data subject access request, under UK, EU/EEA or Swiss law. Fills in the dates if received_date is given. General information, not legal advice.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "kind": {
          "description": "Kind of letter template: acknowledgement, extension, or clarification",
          "type": "string",
          "enum": [
            "acknowledgement",
            "extension",
            "clarification"
          ]
        },
        "jurisdiction": {
          "type": "string",
          "enum": [
            "UK",
            "EU",
            "CH"
          ],
          "description": "UK, EU (EU/EEA GDPR) or CH (Switzerland)."
        },
        "received_date": {
          "type": "string",
          "format": "date",
          "description": "Optional ISO date the clock started. For the UK, the later of receipt and receipt of any requested ID or fee."
        },
        "due_date": {
          "type": "string",
          "format": "date",
          "description": "Optional ISO due date, used in place of the calculated one."
        }
      },
      "required": [
        "kind",
        "jurisdiction"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "breach_triage",
    "title": "Personal data breach triage",
    "description": "A likely-reportability view on a personal data breach (UK, EU/EEA, Switzerland), following the ICO guide \"Personal data breaches: a guide\" and EDPB Guidelines 9/2022: whether notifying the regulator and telling the people affected is likely or unlikely to be required, the factors behind that view, and the notification deadline. The controller decides. General information, not legal advice. Do not pass names or other personal data.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "jurisdiction": {
          "type": "string",
          "enum": [
            "UK",
            "EU",
            "CH"
          ],
          "description": "UK, EU (EU/EEA GDPR) or CH (Switzerland)."
        },
        "aware_at": {
          "type": "string",
          "format": "date-time",
          "description": "ISO date and time, with time zone, when the controller became aware of the breach. Example: 2026-10-17T09:30:00+01:00."
        },
        "people_affected": {
          "oneOf": [
            {
              "type": "integer",
              "minimum": 0
            },
            {
              "type": "string",
              "enum": [
                "unknown"
              ]
            }
          ],
          "description": "Approximate number of people affected, or \"unknown\"."
        },
        "special_category": {
          "type": "boolean",
          "description": "True if special category or criminal offence data is involved (health, biometric, criminal records, etc.)."
        },
        "recipient": {
          "type": "string",
          "enum": [
            "trusted_internal",
            "trusted_external_professional",
            "unknown_or_public",
            "malicious"
          ],
          "description": "Who received or could access the data: a trusted internal person, a trusted external professional, unknown or the public, or a malicious actor."
        },
        "recoverable": {
          "type": "string",
          "enum": [
            "confirmed_deleted",
            "likely",
            "no"
          ],
          "description": "Whether the data has been recovered or deletion confirmed, is likely to be, or not."
        },
        "encrypted": {
          "type": "boolean",
          "description": "True if the data was strongly encrypted and the key was not compromised."
        }
      },
      "required": [
        "jurisdiction",
        "aware_at",
        "people_affected",
        "special_category",
        "recipient",
        "recoverable",
        "encrypted"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "ai_tool_check",
    "title": "AI tool check: DPIA and EU AI Act screening",
    "description": "Screens a planned use of an AI tool: whether a DPIA is likely to be required (Art. 35(3), the ICO high-risk list, the WP248 criteria; FADP Art. 22 for Switzerland), EU AI Act risk flags (Annex III high-risk areas, especially employment; Art. 5 prohibited practices such as emotion recognition at work; current application dates after the Digital Omnibus), and automated decision rules (GDPR Art. 22, UK GDPR Arts 22A to 22D). Findings with sources. The use_case text is not stored or returned. General information, not legal advice.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "use_case": {
          "type": "string",
          "maxLength": 500,
          "description": "Short description of what the AI tool does. No personal data. Not stored."
        },
        "processes_personal_data": {
          "description": "Whether the planned AI tool processes personal data",
          "type": "boolean"
        },
        "special_category": {
          "type": "boolean",
          "description": "Health, biometric, criminal offence data and the like."
        },
        "employees_or_candidates": {
          "type": "boolean",
          "description": "True if it processes data about staff or job candidates."
        },
        "automated_decisions_with_significant_effect": {
          "type": "boolean",
          "description": "True if it makes or drives decisions with legal or similarly significant effects without meaningful human involvement."
        },
        "new_technology": {
          "type": "boolean",
          "description": "True if it is an innovative use or new technology for the organisation."
        },
        "large_scale": {
          "description": "Whether the processing is large scale",
          "type": "boolean"
        },
        "jurisdiction": {
          "type": "string",
          "enum": [
            "UK",
            "EU",
            "CH"
          ],
          "description": "UK, EU (EU/EEA) or CH (Switzerland)."
        }
      },
      "required": [
        "use_case",
        "processes_personal_data",
        "special_category",
        "employees_or_candidates",
        "automated_decisions_with_significant_effect",
        "new_technology",
        "large_scale",
        "jurisdiction"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "hr_retention",
    "title": "HR record retention periods (UK)",
    "description": "Recommended retention period for a common UK HR record, whether it is statutory or only recommended, and the source (HMRC, Home Office, RIDDOR 2013, Working Time Regulations, Limitation Act 1980, ICO, DBS). UK only for now. General information, not legal advice.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "record_type": {
          "description": "Type of HR record to look up the retention period for",
          "type": "string",
          "enum": [
            "payroll_paye",
            "right_to_work",
            "accident_book_riddor",
            "unsuccessful_candidates",
            "personnel_file_after_leaving",
            "disciplinary_grievance",
            "sickness_absence",
            "maternity_smp",
            "paternity_shared_parental",
            "pension_auto_enrolment",
            "working_time",
            "national_minimum_wage",
            "dbs_certificates",
            "cctv"
          ]
        },
        "jurisdiction": {
          "description": "Jurisdiction for the retention guidance",
          "type": "string",
          "enum": [
            "UK"
          ],
          "default": "UK"
        }
      },
      "required": [
        "record_type"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "dsar_search_checklist",
    "title": "DSAR search checklist",
    "description": "Where to search when answering a subject access request, especially from an employee: Microsoft 365 (Exchange and archives, shared mailboxes, Teams, OneDrive, SharePoint), other collaboration tools, HR, payroll, recruitment, CCTV, access logs, devices, line manager notes, paper files, occupational health and backups; search-term tips; and the search standard (UK GDPR Art. 15(1A) reasonable and proportionate searches). General information, not legal advice.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "organisation_type": {
          "description": "Type of organisation the search checklist is for",
          "type": "string",
          "enum": [
            "employer",
            "law_firm",
            "other"
          ]
        }
      },
      "required": [
        "organisation_type"
      ],
      "additionalProperties": false
    }
  }
];

export const TOOL_NAMES = TOOL_DEFS.map((t) => t.name);

/** Whether `name` belongs to the captured built surface. */
export function isKnownTool(name: string): boolean {
  return TOOL_NAMES.includes(name);
}

/* ------------------------------------------------------------------ */
/* Forwarding client                                                   */
/* ------------------------------------------------------------------ */

function errorResult(detail: string): ToolResult {
  return {
    content: [{ type: "text", text: `dsarguide error: ${detail}` }],
    isError: true,
  };
}

function rpcErrorMessage(error: unknown): string {
  if (error !== null && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message !== "") return message;
    return JSON.stringify(error);
  }
  return String(error);
}

/**
 * Read a JSON-RPC response body, tolerating SSE framing.
 * Returns the message whose id matches `expectedId` when
 * present, otherwise the last parseable message, otherwise
 * null when nothing in the body parses.
 */
export function parseRpcBody(
  text: string,
  expectedId?: number,
): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const candidates: Record<string, unknown>[] = [];
  const tryPush = (payload: string): void => {
    try {
      const parsed: unknown = JSON.parse(payload);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        candidates.push(parsed as Record<string, unknown>);
      }
    } catch {
      // Not a JSON payload; skip this candidate.
    }
  };
  if (trimmed.includes("data:")) {
    for (const line of trimmed.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice("data:".length).trim();
      if (payload !== "" && payload !== "[DONE]") tryPush(payload);
    }
  } else {
    tryPush(trimmed);
  }
  if (candidates.length === 0) return null;
  if (expectedId !== undefined) {
    const match = candidates.find((c) => c.id === expectedId);
    if (match !== undefined) return match;
  }
  return candidates[candidates.length - 1];
}

async function defaultFetch(
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
): Promise<FetchResponseLike> {
  return fetch(url, init) as unknown as FetchResponseLike;
}

/**
 * A forwarding client holding a single upstream session,
 * opened lazily on first use and reused from then on
 * (for the process lifetime in the MCP server, or for a
 * single invocation in the CLI).
 */
export class DsarguideClient {
  private readonly deps: ForwardDeps;
  private sessionId: string | null = null;
  private ready = false;
  private sessionPromise: Promise<void> | null = null;
  private idCounter = 0;

  constructor(deps: ForwardDeps = {}) {
    this.deps = deps;
  }

  private fetchFn(): FetchFn {
    return this.deps.fetchFn ?? defaultFetch;
  }

  private endpointUrl(): string {
    if (this.deps.url && this.deps.url.trim() !== "") return this.deps.url.trim();
    const raw = (this.deps.env ?? process.env).DSAR_MCP_URL;
    if (raw && raw.trim() !== "") return raw.trim();
    return DEFAULT_ENDPOINT_URL;
  }

  private timeoutMs(): number {
    if (typeof this.deps.timeoutMs === "number" && this.deps.timeoutMs > 0) {
      return this.deps.timeoutMs;
    }
    return DEFAULT_TIMEOUT_MS;
  }

  private nextId(): number {
    this.idCounter += 1;
    return this.idCounter;
  }

  private async post(
    body: unknown,
    withSession: boolean,
  ): Promise<FetchResponseLike> {
    // The registry record declares NO headers on the upstream
    // remote: no Authorization header is ever sent.
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (withSession && this.sessionId !== null) {
      headers["Mcp-Session-Id"] = this.sessionId;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs());
    try {
      return await this.fetchFn()(this.endpointUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private async ensureSession(): Promise<void> {
    if (this.ready) return;
    if (this.sessionPromise === null) {
      this.sessionPromise = (async () => {
        const initId = this.nextId();
        const initRes = await this.post(
          {
            jsonrpc: "2.0",
            id: initId,
            method: "initialize",
            params: {
              protocolVersion: PROTOCOL_VERSION,
              capabilities: {},
              clientInfo: { name: "dsarguide", version: VERSION },
            },
          },
          false,
        );
        const sessionId = initRes.headers.get("mcp-session-id");
        if (sessionId) this.sessionId = sessionId;
        const initText = await initRes.text();
        const initParsed = parseRpcBody(initText, initId);
        if (initParsed !== null && initParsed.error) {
          throw new Error(rpcErrorMessage(initParsed.error));
        }
        if (initRes.status < 200 || initRes.status >= 300) {
          throw new Error(`HTTP ${initRes.status}`);
        }
        if (initParsed === null && initText.trim() !== "") {
          throw new Error("malformed response");
        }
        const initializedRes = await this.post(
          { jsonrpc: "2.0", method: "notifications/initialized" },
          true,
        );
        try {
          await initializedRes.text();
        } catch {
          // Nothing needed from the notification response body.
        }
        this.ready = true;
      })();
    }
    try {
      await this.sessionPromise;
    } catch (err) {
      this.sessionPromise = null;
      this.sessionId = null;
      throw err;
    }
  }

  /** Forward one tool call; upstream failures come back as isError results. */
  async callTool(name: string, args: ToolArgs): Promise<ToolResult> {
    try {
      await this.ensureSession();
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }

    const callId = this.nextId();
    let callRes: FetchResponseLike;
    try {
      callRes = await this.post(
        {
          jsonrpc: "2.0",
          id: callId,
          method: "tools/call",
          params: { name, arguments: args ?? {} },
        },
        true,
      );
    } catch (err) {
      return errorResult(
        `request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const parsed = parseRpcBody(await callRes.text(), callId);
    if (parsed !== null && parsed.error) {
      return errorResult(rpcErrorMessage(parsed.error));
    }
    if (callRes.status < 200 || callRes.status >= 300) {
      return errorResult(`HTTP ${callRes.status}`);
    }
    if (parsed === null) return errorResult("malformed response");
    const result = parsed.result as ToolResult | undefined;
    if (result === undefined || result === null || typeof result !== "object") {
      return errorResult("malformed response");
    }
    // Hand the upstream result back exactly as received.
    return result;
  }
}

/** Build a forwarding client; tests inject a fake fetch and env through deps. */
export function createClient(deps: ForwardDeps = {}): DsarguideClient {
  return new DsarguideClient(deps);
}

/** One-shot helper: a fresh client for a single call (the CLI path). */
export async function callTool(
  name: string,
  args: ToolArgs,
  deps: ForwardDeps = {},
): Promise<ToolResult> {
  return new DsarguideClient(deps).callTool(name, args);
}
