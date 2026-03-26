#!/usr/bin/env python3
"""Helpers for deterministic UID manifest generation and lookup."""

from __future__ import annotations

import json
from pathlib import Path


ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz"
UID_LENGTH = 3
MANIFEST_PATH = Path(__file__).resolve().parents[1] / "data" / "uid-manifest.json"


def normalize_token(value: object) -> str:
    return str(value or "").strip()


def base_signature(entry: dict, era: str) -> str:
    return "|".join(
        [
            normalize_token(era),
            normalize_token(entry.get("title")),
            normalize_token(entry.get("type")),
            normalize_token(entry.get("releaseYear")),
            normalize_token(entry.get("year")),
        ]
    )


def manifest_key(entry: dict, era: str, occurrence: int) -> str:
    return f"{base_signature(entry, era)}|#{occurrence}"


def encode_base36(number: int, length: int = UID_LENGTH) -> str:
    if number < 0:
        raise ValueError("UID number must be non-negative")
    if number == 0:
        encoded = "0"
    else:
        encoded_chars = []
        current = number
        while current > 0:
            current, remainder = divmod(current, len(ALPHABET))
            encoded_chars.append(ALPHABET[remainder])
        encoded = "".join(reversed(encoded_chars))
    return encoded.rjust(length, "0")


def decode_base36(value: str) -> int:
    total = 0
    for char in str(value or "").strip().lower():
        total = total * len(ALPHABET) + ALPHABET.index(char)
    return total


def normalize_uid(value: str, length: int = UID_LENGTH) -> str:
    return encode_base36(decode_base36(value), length)


def load_manifest(path: Path = MANIFEST_PATH) -> dict:
    if not path.exists():
        return {
            "version": 1,
            "format": f"base36-{UID_LENGTH}",
            "entries": [],
        }
    return json.loads(path.read_text(encoding="utf-8"))


def save_manifest(manifest: dict, path: Path = MANIFEST_PATH) -> None:
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def manifest_entry_map(manifest: dict) -> dict[str, dict]:
    return {
        entry["key"]: entry
        for entry in manifest.get("entries", [])
        if isinstance(entry, dict) and entry.get("key") and entry.get("uid")
    }


def next_uid(manifest: dict) -> str:
    used = [
        decode_base36(entry["uid"])
        for entry in manifest.get("entries", [])
        if isinstance(entry, dict) and entry.get("uid")
    ]
    return encode_base36((max(used) if used else 0) + 1)
