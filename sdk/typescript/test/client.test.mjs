// SDK tests against a local mock of the platform API (node --test).
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { after, before, test } from "node:test"

import { ProofLink, ProofLinkError } from "../dist/index.js"

let server
let base
let pl

before(async () => {
  server = createServer((req, res) => {
    const send = (code, body) => {
      res.writeHead(code, { "Content-Type": "application/json" })
      res.end(JSON.stringify(body))
    }
    if (req.method === "GET" && req.url === "/v1/status") {
      return send(200, { ok: true, status: "OPERATIONAL", containers: 141 })
    }
    if (req.method === "GET" && req.url === "/api/stats") {
      return send(200, { receipts: 28906, chain_breaks: 0 })
    }
    if (req.method === "GET" && req.url.startsWith("/api/verify/rcpt_good")) {
      return send(200, { found: true, chain_intact: true, chain_position: 7, anchored: true })
    }
    if (req.method === "GET" && req.url.startsWith("/api/verify/")) {
      return send(200, { found: false, chain_intact: false })
    }
    if (req.method === "POST" && req.url === "/api/v1/receipts/seal") {
      if (req.headers.authorization !== "Bearer test-key") return send(401, { error: "unauthorized" })
      let raw = ""
      req.on("data", (c) => (raw += c))
      req.on("end", () => {
        const body = JSON.parse(raw)
        if (!body.category) return send(400, { error: "category required" })
        send(200, { id: "rcpt_good", chain_position: 28907, sealed_at: "2026-06-09T00:00:00Z" })
      })
      return
    }
    send(404, { error: "not found" })
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  base = `http://127.0.0.1:${server.address().port}`
  pl = new ProofLink({ apiKey: "test-key", tenant: "acme", apiBase: base, verifyBase: base })
})

after(() => server.close())

test("status", async () => {
  const status = await pl.status()
  assert.equal(status.status, "OPERATIONAL")
})

test("stats", async () => {
  const stats = await pl.stats()
  assert.equal(stats.receipts, 28906)
})

test("seal + verify roundtrip", async () => {
  const receipt = await pl.seal({ category: "test_event", actor: "node-test", action: "ran tests" })
  assert.equal(receipt.id, "rcpt_good")
  assert.equal(receipt.chainPosition, 28907)
  assert.ok(receipt.verifyUrl.includes("/api/verify/rcpt_good"))
  const result = await pl.verify(receipt.id)
  assert.equal(result.found, true)
  assert.equal(result.chainIntact, true)
  assert.equal(result.anchored, true)
})

test("verify unknown receipt", async () => {
  const result = await pl.verify("rcpt_missing")
  assert.equal(result.found, false)
})

test("seal validates input", async () => {
  await assert.rejects(() => pl.seal({ category: "", actor: "a", action: "b" }), ProofLinkError)
})

test("auth failure raises with status", async () => {
  const bad = new ProofLink({ apiKey: "wrong", apiBase: base, verifyBase: base })
  await assert.rejects(
    () => bad.seal({ category: "x", actor: "y", action: "z" }),
    (err) => err instanceof ProofLinkError && err.status === 401
  )
})
