"""SDK + CLI tests against a local mock of the platform API."""

from __future__ import annotations

import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

from itechsmart import ProofLink, ProofLinkError
from itechsmart.cli import main as cli_main


class MockApi(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict) -> None:
        payload = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path == "/v1/status":
            self._send(200, {"ok": True, "status": "OPERATIONAL", "containers": 141})
        elif self.path == "/api/stats":
            self._send(200, {"receipts": 28906, "chain_breaks": 0})
        elif self.path.startswith("/api/verify/rcpt_good"):
            self._send(200, {"found": True, "chain_intact": True, "chain_position": 7, "anchored": True})
        elif self.path.startswith("/api/verify/"):
            self._send(200, {"found": False, "chain_intact": False})
        elif self.path == "/api/v1/ag2/incidents":
            self._send(200, {"incidents": [{"id": "INC-1", "severity": "low", "status": "resolved", "title": "t"}]})
        elif self.path == "/api/v1/uaio-certification/status":
            self._send(200, {"current": "Silver", "next": "Gold"})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/api/v1/receipts/seal":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            if self.headers.get("Authorization") != "Bearer test-key":
                self._send(401, {"error": "unauthorized"})
                return
            if not body.get("category"):
                self._send(400, {"error": "category required"})
                return
            self._send(200, {"id": "rcpt_good", "chain_position": 28907, "sealed_at": "2026-06-09T00:00:00Z"})
        else:
            self._send(404, {"error": "not found"})

    def log_message(self, *args):  # silence test output
        pass


class SdkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(("127.0.0.1", 0), MockApi)
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.pl = ProofLink(api_key="test-key", tenant="acme", api_base=cls.base, verify_base=cls.base)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def test_status(self):
        self.assertEqual(self.pl.status()["status"], "OPERATIONAL")

    def test_stats(self):
        self.assertEqual(self.pl.stats()["receipts"], 28906)

    def test_seal_and_verify_roundtrip(self):
        receipt = self.pl.seal(category="test_event", actor="unit-test", action="ran tests")
        self.assertEqual(receipt.id, "rcpt_good")
        self.assertEqual(receipt.chain_position, 28907)
        self.assertIn("/api/verify/rcpt_good", receipt.verify_url)
        result = self.pl.verify(receipt.id)
        self.assertTrue(result.found)
        self.assertTrue(result.chain_intact)
        self.assertTrue(result.anchored)

    def test_verify_unknown_receipt(self):
        result = self.pl.verify("rcpt_missing")
        self.assertFalse(result.found)

    def test_seal_requires_fields(self):
        with self.assertRaises(ValueError):
            self.pl.seal(category="", actor="a", action="b")

    def test_auth_failure_raises(self):
        bad = ProofLink(api_key="wrong", api_base=self.base, verify_base=self.base)
        with self.assertRaises(ProofLinkError) as ctx:
            bad.seal(category="x", actor="y", action="z")
        self.assertEqual(ctx.exception.status, 401)

    def test_cli_status_and_verify(self):
        flags = ["--api-base", self.base, "--verify-base", self.base]
        self.assertEqual(cli_main([*flags, "status"]), 0)
        self.assertEqual(cli_main([*flags, "verify", "rcpt_good"]), 0)
        self.assertEqual(cli_main([*flags, "verify", "rcpt_missing"]), 1)
        self.assertEqual(
            cli_main([*flags, "--api-key", "test-key", "seal",
                      "--category", "t", "--actor", "cli", "--action", "test"]),
            0,
        )


if __name__ == "__main__":
    unittest.main()
