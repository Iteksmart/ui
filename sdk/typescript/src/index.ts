/**
 * iTechSmart ProofLink SDK — seal and verify cryptographic audit receipts.
 *
 *   import { ProofLink } from "@itechsmart/prooflink"
 *   const pl = new ProofLink({ apiKey: "your-key" })
 *   const receipt = await pl.seal({ category: "deploy", actor: "ci", action: "v2.1.0" })
 *   const result = await pl.verify(receipt.id)
 */

const DEFAULT_API_BASE = "https://api.itechsmart.dev"
const DEFAULT_VERIFY_BASE = "https://verify.itechsmart.dev"

export interface ProofLinkOptions {
  apiKey?: string
  tenant?: string
  apiBase?: string
  verifyBase?: string
  fetch?: typeof fetch
}

export interface SealInput {
  category: string
  actor: string
  action: string
  outcome?: string
  metadata?: Record<string, unknown>
}

export interface Receipt {
  id: string
  category: string
  chainPosition: number | null
  sealedAt: string | null
  verifyUrl: string
  raw: Record<string, unknown>
}

export interface VerifyResult {
  found: boolean
  chainIntact: boolean
  chainPosition: number | null
  anchored: boolean
  raw: Record<string, unknown>
}

export class ProofLinkError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = "ProofLinkError"
    this.status = status
  }
}

export class ProofLink {
  private readonly apiKey?: string
  private readonly tenant?: string
  private readonly apiBase: string
  private readonly verifyBase: string
  private readonly fetchImpl: typeof fetch

  constructor(options: ProofLinkOptions = {}) {
    this.apiKey = options.apiKey
    this.tenant = options.tenant
    this.apiBase = (options.apiBase ?? DEFAULT_API_BASE).replace(/\/+$/, "")
    this.verifyBase = (options.verifyBase ?? DEFAULT_VERIFY_BASE).replace(/\/+$/, "")
    this.fetchImpl = options.fetch ?? fetch
  }

  private async request(
    method: "GET" | "POST",
    url: string,
    body?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "itechsmart-prooflink-ts/1.0.0",
    }
    if (body) headers["Content-Type"] = "application/json"
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`
    if (this.tenant) headers["X-ITS-Tenant"] = this.tenant

    let res: Response
    try {
      res = await this.fetchImpl(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      throw new ProofLinkError(`${method} ${url} unreachable: ${String(err)}`)
    }
    const text = await res.text()
    if (!res.ok) {
      throw new ProofLinkError(`${method} ${url} -> HTTP ${res.status}: ${text.slice(0, 300)}`, res.status)
    }
    try {
      return text ? (JSON.parse(text) as Record<string, unknown>) : {}
    } catch {
      throw new ProofLinkError(`${method} ${url} returned invalid JSON`)
    }
  }

  /** Seal a receipt via POST /api/v1/receipts/seal. */
  async seal(input: SealInput): Promise<Receipt> {
    if (!input.category || !input.actor || !input.action) {
      throw new ProofLinkError("category, actor, and action are required")
    }
    const body: Record<string, unknown> = {
      category: input.category,
      actor: input.actor,
      action: input.action,
      outcome: input.outcome ?? "success",
    }
    if (input.metadata) body.metadata = input.metadata
    if (this.tenant) body.tenant = this.tenant

    const raw = await this.request("POST", `${this.apiBase}/api/v1/receipts/seal`, body)
    const id = String(raw.id ?? raw.receipt_id ?? "")
    if (!id) throw new ProofLinkError("seal succeeded but no receipt id in response")
    return {
      id,
      category: input.category,
      chainPosition: typeof raw.chain_position === "number" ? raw.chain_position : null,
      sealedAt: typeof raw.sealed_at === "string" ? raw.sealed_at : null,
      verifyUrl: typeof raw.verify_url === "string" ? raw.verify_url : `${this.verifyBase}/api/verify/${id}`,
      raw,
    }
  }

  /** Verify a receipt against the public ledger — no auth required. */
  async verify(receiptId: string): Promise<VerifyResult> {
    if (!receiptId) throw new ProofLinkError("receiptId is required")
    const raw = await this.request("GET", `${this.verifyBase}/api/verify/${receiptId}`)
    return {
      found: Boolean(raw.found ?? raw.ok ?? false),
      chainIntact: Boolean(raw.chain_intact ?? raw.valid ?? false),
      chainPosition: typeof raw.chain_position === "number" ? raw.chain_position : null,
      anchored: Boolean(raw.anchored ?? false),
      raw,
    }
  }

  /** Public ledger stats. */
  async stats(): Promise<Record<string, unknown>> {
    return this.request("GET", `${this.verifyBase}/api/stats`)
  }

  /** Platform health. */
  async status(): Promise<Record<string, unknown>> {
    return this.request("GET", `${this.apiBase}/v1/status`)
  }
}
