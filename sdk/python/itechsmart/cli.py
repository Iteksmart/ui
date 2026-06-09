"""`its` — the iTechSmart platform CLI.

    its status                  platform health
    its stats                   public ledger stats
    its verify <receipt-id>     verify a ProofLink receipt
    its seal --category X --actor Y --action Z
    its incidents               recent AG2 incidents
    its cert                    UAIO certification status
"""

from __future__ import annotations

import argparse
import json
import os
import sys

from .client import DEFAULT_API_BASE, DEFAULT_VERIFY_BASE, ProofLink, ProofLinkError

GREEN, RED, DIM, BOLD, RESET = "\033[32m", "\033[31m", "\033[2m", "\033[1m", "\033[0m"


def _color(s: str, code: str) -> str:
    return f"{code}{s}{RESET}" if sys.stdout.isatty() else s


def _client(args: argparse.Namespace) -> ProofLink:
    return ProofLink(
        api_key=args.api_key or os.environ.get("ITS_API_KEY"),
        tenant=args.tenant or os.environ.get("ITS_TENANT"),
        api_base=args.api_base,
        verify_base=args.verify_base,
    )


def _print_json(data: dict) -> None:
    print(json.dumps(data, indent=2, sort_keys=True))


def cmd_status(args: argparse.Namespace) -> int:
    data = _client(args).status()
    state = str(data.get("status", "UNKNOWN"))
    badge = _color(f" {state} ", GREEN if state == "OPERATIONAL" else RED)
    print(f"{badge}  containers={data.get('containers', '?')}  "
          f"mttr={data.get('mttr_minutes', data.get('mttr', '?'))}min  "
          f"autonomy={data.get('autonomy_rate', '?')}%")
    if args.json:
        _print_json(data)
    return 0


def cmd_stats(args: argparse.Namespace) -> int:
    data = _client(args).stats()
    print(f"receipts={data.get('receipts', '?')}  chain_breaks={data.get('chain_breaks', '?')}  "
          f"anchored={data.get('bitcoin_anchored', '?')}")
    if args.json:
        _print_json(data)
    return 0


def cmd_verify(args: argparse.Namespace) -> int:
    result = _client(args).verify(args.receipt_id)
    if result.found and result.chain_intact:
        print(_color("✓ verified", GREEN) + f"  {args.receipt_id}  "
              f"position={result.chain_position}  anchored={result.anchored}")
        return 0
    print(_color("✗ NOT verified", RED) + f"  {args.receipt_id}  "
          f"found={result.found} chain_intact={result.chain_intact}")
    return 1


def cmd_seal(args: argparse.Namespace) -> int:
    receipt = _client(args).seal(
        category=args.category, actor=args.actor, action=args.action, outcome=args.outcome
    )
    print(_color("✓ sealed", GREEN) + f"  {receipt.id}")
    print(f"{_color('verify:', DIM)} {receipt.verify_url}")
    return 0


def cmd_incidents(args: argparse.Namespace) -> int:
    data = _client(args)._request("GET", f"{args.api_base}/api/v1/ag2/incidents")
    incidents = data.get("incidents", data if isinstance(data, list) else [])
    for inc in list(incidents)[:10]:
        print(f"{inc.get('id', '?'):>10}  {inc.get('severity', '?'):<8}  "
              f"{inc.get('status', '?'):<12}  {inc.get('title', inc.get('service', ''))}")
    if not incidents:
        print("no incidents — all quiet")
    return 0


def cmd_cert(args: argparse.Namespace) -> int:
    data = _client(args)._request("GET", f"{args.api_base}/api/v1/uaio-certification/status")
    print(f"UAIO {_color(str(data.get('current', '?')), BOLD)} — next: {data.get('next', '?')}")
    if args.json:
        _print_json(data)
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="its", description="iTechSmart platform CLI")
    p.add_argument("--api-base", default=os.environ.get("ITS_API_BASE", DEFAULT_API_BASE))
    p.add_argument("--verify-base", default=os.environ.get("ITS_VERIFY_BASE", DEFAULT_VERIFY_BASE))
    p.add_argument("--api-key", default=None)
    p.add_argument("--tenant", default=None)
    p.add_argument("--json", action="store_true", help="print full JSON response")
    sub = p.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="platform health").set_defaults(fn=cmd_status)
    sub.add_parser("stats", help="public ledger stats").set_defaults(fn=cmd_stats)

    v = sub.add_parser("verify", help="verify a ProofLink receipt")
    v.add_argument("receipt_id")
    v.set_defaults(fn=cmd_verify)

    s = sub.add_parser("seal", help="seal a ProofLink receipt")
    s.add_argument("--category", required=True)
    s.add_argument("--actor", required=True)
    s.add_argument("--action", required=True)
    s.add_argument("--outcome", default="success")
    s.set_defaults(fn=cmd_seal)

    sub.add_parser("incidents", help="recent AG2 incidents").set_defaults(fn=cmd_incidents)
    sub.add_parser("cert", help="UAIO certification status").set_defaults(fn=cmd_cert)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.fn(args)
    except ProofLinkError as e:
        print(_color(f"error: {e}", RED), file=sys.stderr)
        return 2
    except ValueError as e:
        print(_color(f"usage error: {e}", RED), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
