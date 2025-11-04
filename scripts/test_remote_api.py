#!/usr/bin/env python3
"""
Simple helper script to exercise the external links API endpoint.

Usage example:
  python scripts/test_remote_api.py \
    --base-url https://elink1.pages.dev \
    --text "Search engine optimization is crucial" \
    --access-key <your-access-key> \
    --token <x-token-from-admin>

Optional arguments let you specify a custom model, provider, api key, etc.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request


def build_payload(args: argparse.Namespace) -> dict[str, object]:
    payload: dict[str, object] = {
        "text": args.text,
        "accessKey": args.access_key,
    }

    if args.model:
        payload["model"] = args.model
    if args.provider:
        payload["provider"] = args.provider
    if args.api_key:
        payload["apiKey"] = args.api_key
    if args.base_url_param:
        payload["baseUrl"] = args.base_url_param
    if args.preferred_sites:
        payload["preferredSites"] = args.preferred_sites
    if args.blacklist:
        payload["blacklist"] = args.blacklist

    return payload


def perform_request(args: argparse.Namespace) -> None:
    payload = build_payload(args)
    url = f"{args.base_url.rstrip('/')}/api/external-links"
    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-token": args.token,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=args.timeout) as response:
            payload = response.read().decode("utf-8")
            try:
                parsed = json.loads(payload)
                print(json.dumps(parsed, ensure_ascii=False, indent=2))
            except json.JSONDecodeError:
                print(payload)
    except urllib.error.HTTPError as http_error:
        sys.stderr.write(
            f"[HTTP {http_error.code}] {http_error.reason}\n"
        )
        if http_error.fp is not None:
            body = http_error.fp.read().decode("utf-8", errors="replace")
            sys.stderr.write(f"{body}\n")
        sys.exit(http_error.code)
    except urllib.error.URLError as url_error:
        sys.stderr.write(f"[Network error] {url_error.reason}\n")
        sys.exit(1)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Invoke the external links API endpoint for manual testing."
    )
    parser.add_argument(
        "--base-url",
        default="https://elink1.pages.dev",
        help="Base URL of the deployed application (default: %(default)s)",
    )
    parser.add_argument(
        "--text",
        required=True,
        help="English text to analyse.",
    )
    parser.add_argument(
        "--access-key",
        required=True,
        help="Access key issued from the admin portal.",
    )
    parser.add_argument(
        "--token",
        required=True,
        help="Request token to send in the x-token header.",
    )
    parser.add_argument(
        "--model",
        help="Optional model name (e.g., gpt-4o-mini).",
    )
    parser.add_argument(
        "--provider",
        help="Optional provider (e.g., openai or custom).",
    )
    parser.add_argument(
        "--api-key",
        help="Optional model API key.",
    )
    parser.add_argument(
        "--base-url-param",
        help="Optional base URL for the custom provider (maps to baseUrl in the JSON body).",
    )
    parser.add_argument(
        "--preferred-sites",
        nargs="+",
        help="Optional list of preferred domains.",
    )
    parser.add_argument(
        "--blacklist",
        nargs="+",
        help="Optional list of domains to exclude.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="Network timeout in seconds (default: %(default)s).",
    )

    return parser.parse_args(argv)


def main(argv: list[str]) -> None:
    args = parse_args(argv)
    perform_request(args)


if __name__ == "__main__":
    main(sys.argv[1:])
