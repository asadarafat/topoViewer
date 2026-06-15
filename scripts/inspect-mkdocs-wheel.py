#!/usr/bin/env python3
"""Validate mkdocs-topoviewer wheel contents before release."""

from __future__ import annotations

import glob
import sys
import zipfile
from pathlib import Path


REQUIRED_SUFFIXES = {
    "mkdocs_topoviewer/__init__.py",
    "mkdocs_topoviewer/plugin.py",
    "mkdocs_topoviewer/assets/topoviewer-embed.css",
    "mkdocs_topoviewer/assets/topoviewer-embed.iife.js",
    "mkdocs_topoviewer/assets/topoviewer-mkdocs.css",
}


def fail(message: str) -> int:
    print(f"wheel inspection failed: {message}", file=sys.stderr)
    return 1


def find_wheel(path: Path) -> Path | None:
    if path.is_file() and path.suffix == ".whl":
        return path
    matches = sorted(glob.glob(str(path / "mkdocs_topoviewer-*.whl")))
    return Path(matches[-1]) if matches else None


def main() -> int:
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".artifacts/wheels")
    wheel = find_wheel(target)
    if wheel is None:
        return fail(f"no mkdocs_topoviewer wheel found in {target}")

    with zipfile.ZipFile(wheel) as archive:
        names = set(archive.namelist())

    missing = sorted(REQUIRED_SUFFIXES - names)
    if missing:
        return fail(f"missing required files: {', '.join(missing)}")

    forbidden = sorted(
        name for name in names
        if "build/" in name
        or ".egg-info/" in name
        or "__pycache__/" in name
        or name.endswith(".pyc")
    )
    if forbidden:
        return fail(f"forbidden generated files in wheel: {', '.join(forbidden[:10])}")

    dist_info = [name for name in names if name.endswith(".dist-info/entry_points.txt")]
    if not dist_info:
        return fail("missing dist-info entry_points.txt")

    print(f"wheel inspection passed: {wheel}")
    print(f"files: {len(names)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
