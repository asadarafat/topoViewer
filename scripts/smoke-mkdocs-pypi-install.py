#!/usr/bin/env python3
"""Smoke-test mkdocs-topoviewer from production PyPI in a clean MkDocs site."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path


PACKAGE = "mkdocs-topoviewer"
EXPECTED_VERSION = os.environ.get("TOPOVIEWER_MKDOCS_PYPI_VERSION", "0.1.0")


def run(args: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        args,
        cwd=cwd,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if result.returncode != 0:
        raise SystemExit(
            f"{' '.join(args)} failed with exit {result.returncode}\n{result.stdout}"
        )
    return result


def write_site(site_root: Path) -> None:
    docs_root = site_root / "docs"
    docs_root.mkdir(parents=True)

    (site_root / "mkdocs.yml").write_text(
        textwrap.dedent(
            """\
            site_name: TopoViewer PyPI Smoke
            plugins:
              - search
              - topoviewer
            nav:
              - Home: index.md
            """
        ),
        encoding="utf-8",
    )
    (docs_root / "index.md").write_text(
        textwrap.dedent(
            """\
            # TopoViewer PyPI Smoke

            ```topoviewer
            topology: ./topology.yaml
            stylesheet: ./stylesheet.yaml
            height: 360px
            title: PyPI smoke topology
            controls: true
            controlsOpen: false
            ```
            """
        ),
        encoding="utf-8",
    )
    (docs_root / "topology.yaml").write_text(
        textwrap.dedent(
            """\
            graph:
              id: pypi-smoke
              layers:
                - id: physical
                  name: Physical
              nodes:
                - id: R1
                  name: R1
                  labels:
                    node: router
                  layers:
                    - physical
                  position: [120, 120]
                - id: R2
                  name: R2
                  labels:
                    node: router
                  layers:
                    - physical
                  position: [360, 120]
              links:
                - id: R1-R2
                  name: R1 to R2
                  source: R1
                  target: R2
                  labels:
                    link: physical
                  layers:
                    - physical
            """
        ),
        encoding="utf-8",
    )
    (docs_root / "stylesheet.yaml").write_text(
        textwrap.dedent(
            """\
            layout:
              mode: manual
              width: 480
              height: 260
            icons:
              router:
                glyph: R
                fill: "#1976d2"
                stroke: "#bbdefb"
            labelFields:
              - name
            stylesheet:
              - selector: node
                style:
                  icon: router
                  shape: rectangle
                  width: 84
                  height: 60
                  borderWidth: 3
                  labelFontWeight: 800
              - selector: link
                style:
                  lineColor: "#42a5f5"
                  lineWidth: 3
                  targetArrowShape: none
            """
        ),
        encoding="utf-8",
    )


def assert_site(site_root: Path, version: str) -> None:
    site_dir = site_root / "site"
    index = site_dir / "index.html"
    if not index.exists():
        raise SystemExit("MkDocs build did not create site/index.html")

    html = index.read_text(encoding="utf-8")
    required_html = [
        "topoviewer-embed topoviewer-parity-theme",
        'data-topology="topology.yaml"',
        'data-stylesheet="stylesheet.yaml"',
        "PyPI smoke topology",
    ]
    for marker in required_html:
        if marker not in html:
            raise SystemExit(f"Generated MkDocs page is missing marker: {marker}")

    required_assets = [
        "assets/topoviewer/topoviewer-embed.css",
        "assets/topoviewer/topoviewer-mkdocs.css",
        "assets/topoviewer/topoviewer-embed.iife.js",
    ]
    for asset in required_assets:
        if not (site_dir / asset).is_file():
            raise SystemExit(f"Generated MkDocs site is missing asset: {asset}")

    print(f"{PACKAGE}=={version} PyPI MkDocs smoke passed")


def main() -> None:
    temp_root = Path(tempfile.mkdtemp(prefix="topoviewer-mkdocs-pypi-smoke-"))
    try:
        venv = temp_root / "venv"
        site_root = temp_root / "site-src"
        run([sys.executable, "-m", "venv", str(venv)])
        python = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        run([str(python), "-m", "pip", "install", "--quiet", "--upgrade", "pip"])
        run([str(python), "-m", "pip", "install", "--quiet", f"{PACKAGE}=={EXPECTED_VERSION}"])
        version = run(
            [
                str(python),
                "-c",
                "import importlib.metadata; print(importlib.metadata.version('mkdocs-topoviewer'))",
            ]
        ).stdout.strip()
        if version != EXPECTED_VERSION:
            raise SystemExit(f"Expected {PACKAGE}=={EXPECTED_VERSION}, got {version}")
        write_site(site_root)
        run([str(python), "-m", "mkdocs", "build", "--strict"], cwd=site_root)
        assert_site(site_root, version)
    finally:
        shutil.rmtree(temp_root, ignore_errors=True)


if __name__ == "__main__":
    main()
