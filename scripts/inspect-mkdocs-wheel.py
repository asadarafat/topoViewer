#!/usr/bin/env python3
"""Validate mkdocs-topoviewer Python distribution artifacts before release."""

from __future__ import annotations

import email
import glob
import re
import sys
import tarfile
import zipfile
from pathlib import Path


PACKAGE_NAME = "mkdocs-topoviewer"
PYPROJECT = Path(__file__).resolve().parent.parent / "packages/mkdocs-topoviewer/pyproject.toml"


def read_package_version() -> str:
    text = PYPROJECT.read_text(encoding="utf-8")
    match = re.search(r'^version\s*=\s*"([^"]+)"\s*$', text, flags=re.MULTILINE)
    if match is None:
        raise RuntimeError(f"could not read project version from {PYPROJECT}")
    return match.group(1)


PACKAGE_VERSION = read_package_version()

REQUIRED_PACKAGE_SUFFIXES = {
    "mkdocs_topoviewer/__init__.py",
    "mkdocs_topoviewer/plugin.py",
    "mkdocs_topoviewer/assets/topoviewer-embed.css",
    "mkdocs_topoviewer/assets/topoviewer-embed.iife.js",
    "mkdocs_topoviewer/assets/topoviewer-mkdocs.css",
}

REQUIRED_SDIST_SUFFIXES = {
    "LICENSE",
    "MANIFEST.in",
    "PKG-INFO",
    "README.md",
    "pyproject.toml",
    *REQUIRED_PACKAGE_SUFFIXES,
}

FORBIDDEN_PATH_PARTS = (
    "/build/",
    ".egg-info/",
    "__pycache__/",
)


def fail(message: str) -> int:
    print(f"mkdocs-topoviewer artifact inspection failed: {message}", file=sys.stderr)
    return 1


def find_one(path: Path, pattern: str, label: str) -> Path | None:
    matches = sorted(glob.glob(str(path / pattern)))
    if len(matches) > 1:
        raise ValueError(f"expected one {label} in {path}, found {len(matches)}")
    return Path(matches[0]) if matches else None


def resolve_artifacts(target: Path) -> tuple[Path | None, Path | None]:
    if target.is_file():
        if target.suffix == ".whl":
            return target, None
        if target.name.endswith(".tar.gz"):
            return None, target
        raise ValueError(f"unsupported artifact path: {target}")

    wheel = find_one(target, "mkdocs_topoviewer-*.whl", "wheel")
    sdist = find_one(target, "mkdocs_topoviewer-*.tar.gz", "sdist")
    return wheel, sdist


def normalized_sdist_names(raw_names: set[str]) -> set[str]:
    normalized = set()
    for name in raw_names:
        parts = name.split("/", 1)
        normalized.add(parts[1] if len(parts) == 2 else name)
    return normalized


def assert_no_forbidden_files(names: set[str], artifact_label: str) -> list[str]:
    forbidden = sorted(
        name
        for name in names
        if any(part in f"/{name}" for part in FORBIDDEN_PATH_PARTS)
        or name.endswith(".pyc")
    )
    if forbidden:
        raise ValueError(
            f"forbidden generated files in {artifact_label}: {', '.join(forbidden[:10])}"
        )
    return forbidden


def assert_metadata(metadata_text: str, artifact_label: str) -> None:
    metadata = email.message_from_string(metadata_text)
    if metadata.get("Name") != PACKAGE_NAME:
        raise ValueError(f"{artifact_label} metadata has unexpected Name: {metadata.get('Name')}")
    if metadata.get("Version") != PACKAGE_VERSION:
        raise ValueError(
            f"{artifact_label} metadata has unexpected Version: {metadata.get('Version')}"
        )

    license_value = metadata.get("License")
    license_expression = metadata.get("License-Expression")
    if license_value != "Apache-2.0" and license_expression != "Apache-2.0":
        raise ValueError(
            f"{artifact_label} metadata must declare Apache-2.0 license; "
            f"got License={license_value!r}, License-Expression={license_expression!r}"
        )

    requires_python = metadata.get("Requires-Python")
    if requires_python != ">=3.9":
        raise ValueError(
            f"{artifact_label} metadata has unexpected Requires-Python: {requires_python}"
        )

    requires_dist = {item.lower() for item in metadata.get_all("Requires-Dist", [])}
    required_dependency_prefixes = ("mkdocs<2,>=1.5", "pyyaml>=6.0")
    for required_prefix in required_dependency_prefixes:
        if not any(item.startswith(required_prefix) for item in requires_dist):
            raise ValueError(f"{artifact_label} metadata is missing dependency {required_prefix}")

    project_urls = set(metadata.get_all("Project-URL", []))
    expected_urls = {
        "Homepage, https://github.com/asadarafat/topoviewer",
        "Repository, https://github.com/asadarafat/topoviewer",
        "Issues, https://github.com/asadarafat/topoviewer/issues",
    }
    missing_urls = sorted(expected_urls - project_urls)
    if missing_urls:
        raise ValueError(f"{artifact_label} metadata missing project URLs: {missing_urls}")


def inspect_wheel(wheel: Path) -> tuple[int, str]:
    with zipfile.ZipFile(wheel) as archive:
        names = set(archive.namelist())

        missing = sorted(REQUIRED_PACKAGE_SUFFIXES - names)
        if missing:
            raise ValueError(f"wheel missing required files: {', '.join(missing)}")

        assert_no_forbidden_files(names, "wheel")

        metadata_names = sorted(name for name in names if name.endswith(".dist-info/METADATA"))
        entry_point_names = sorted(
            name for name in names if name.endswith(".dist-info/entry_points.txt")
        )
        if len(metadata_names) != 1:
            raise ValueError(f"wheel must contain exactly one METADATA file, found {len(metadata_names)}")
        if len(entry_point_names) != 1:
            raise ValueError(
                f"wheel must contain exactly one entry_points.txt file, found {len(entry_point_names)}"
            )

        assert_metadata(archive.read(metadata_names[0]).decode("utf-8"), "wheel")
        entry_points = archive.read(entry_point_names[0]).decode("utf-8")
        if "topoviewer = mkdocs_topoviewer.plugin:TopoViewerPlugin" not in entry_points:
            raise ValueError("wheel entry_points.txt is missing MkDocs plugin key topoviewer")

    return len(names), wheel.name


def inspect_sdist(sdist: Path) -> tuple[int, str]:
    with tarfile.open(sdist, "r:gz") as archive:
        raw_names = set(archive.getnames())
        names = normalized_sdist_names(raw_names)

        missing = sorted(REQUIRED_SDIST_SUFFIXES - names)
        if missing:
            raise ValueError(f"sdist missing required files: {', '.join(missing)}")

        assert_no_forbidden_files(names, "sdist")

        pkg_info_member = next((member for member in archive.getmembers() if member.name.endswith("/PKG-INFO")), None)
        if pkg_info_member is None:
            raise ValueError("sdist missing PKG-INFO metadata")
        pkg_info_file = archive.extractfile(pkg_info_member)
        if pkg_info_file is None:
            raise ValueError("sdist PKG-INFO could not be read")
        assert_metadata(pkg_info_file.read().decode("utf-8"), "sdist")

    return len(names), sdist.name


def main() -> int:
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".artifacts/mkdocs-dist")

    try:
        wheel, sdist = resolve_artifacts(target)
    except ValueError as error:
        return fail(str(error))

    if wheel is None and sdist is None:
        return fail(f"no mkdocs_topoviewer wheel or sdist found in {target}")
    if target.is_dir() and (wheel is None or sdist is None):
        return fail(f"expected both wheel and sdist in {target}")

    try:
        if wheel is not None:
            wheel_count, wheel_name = inspect_wheel(wheel)
            print(f"wheel inspection passed: {wheel_name} ({wheel_count} files)")
        if sdist is not None:
            sdist_count, sdist_name = inspect_sdist(sdist)
            print(f"sdist inspection passed: {sdist_name} ({sdist_count} files)")
    except ValueError as error:
        return fail(str(error))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
