import hashlib
import html
import json
import posixpath
import re
import textwrap
from importlib.resources import files
from urllib.parse import urlparse

import yaml
from mkdocs.config import config_options
from mkdocs.exceptions import PluginError
from mkdocs.plugins import BasePlugin
from mkdocs.structure.files import File

ASSET_FILES = (
    "topoviewer-embed.css",
    "topoviewer-mkdocs.css",
    "topoviewer-embed.iife.js",
)

FENCE_RE = re.compile(r"(^|\n)([ \t]*)```topoviewer[ \t]*\n(.*?)\n\2```", re.DOTALL)


def _append_unique(config, key, value):
    current = list(config.get(key) or [])
    if value not in current:
        current.append(value)
    config[key] = current


def _is_external_reference(value):
    parsed = urlparse(value)
    return bool(parsed.scheme or value.startswith("/") or value.startswith("#"))


def _source_uri(page, reference):
    reference = str(reference)
    if _is_external_reference(reference):
        return reference
    if reference.startswith("examples/"):
        return posixpath.normpath(posixpath.join("topoviewer", reference))
    source_dir = posixpath.dirname(page.file.src_uri)
    return posixpath.normpath(posixpath.join(source_dir, reference))


def _page_base_url(page):
    url = page.file.url or ""
    if url.endswith("/"):
        return url
    directory = posixpath.dirname(url)
    return f"{directory}/" if directory else ""


def _relative_page_url(page, source_uri):
    if _is_external_reference(source_uri):
        return source_uri
    base = _page_base_url(page)
    return posixpath.relpath(source_uri, base or ".")


def _load_fence_config(raw, page):
    try:
        config = yaml.safe_load(raw) or {}
    except yaml.YAMLError as error:
        raise PluginError(f"Invalid TopoViewer fence YAML in {page.file.src_uri}: {error}") from error

    if not isinstance(config, dict):
        raise PluginError(f"Invalid TopoViewer fence in {page.file.src_uri}: expected a YAML mapping.")
    if not config.get("topology"):
        raise PluginError(f"Invalid TopoViewer fence in {page.file.src_uri}: 'topology' is required.")

    return config


def _fence_bool(config, key, default=True):
    value = config.get(key, default)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() not in {"0", "false", "no", "off"}
    return bool(value)


class TopoViewerPlugin(BasePlugin):
    config_scheme = (
        ("asset_path", config_options.Type(str, default="assets/topoviewer")),
    )

    def _asset_uri(self, file_name):
        asset_path = self.config.get("asset_path", "assets/topoviewer").strip("/")
        return posixpath.join(asset_path, file_name)

    def _embed_html(self, config, page, ordinal):
        topology_source = _source_uri(page, config["topology"])
        stylesheet_source = _source_uri(page, config["stylesheet"]) if config.get("stylesheet") else ""
        topology_url = _relative_page_url(page, topology_source)
        stylesheet_url = _relative_page_url(page, stylesheet_source) if stylesheet_source else ""
        height = html.escape(str(config.get("height") or "560px"), quote=True)
        width = html.escape(str(config.get("width") or "100%"), quote=True)
        controls = "true" if _fence_bool(config, "controls", True) else "false"
        controls_open = "true" if _fence_bool(config, "controlsOpen", False) else "false"
        title = str(config.get("title") or "").strip()
        attention = config.get("attention")
        helper_lines = config.get("helperLines", True)
        selected_layer_ids = config.get("selectedLayerIds")
        seed = f"{page.file.src_uri}:{ordinal}:{topology_source}:{stylesheet_source}"
        embed_id = f"topoviewer-{hashlib.sha1(seed.encode('utf-8')).hexdigest()[:10]}"

        attributes = [
            f'id="{embed_id}"',
            'class="topoviewer-embed topoviewer-parity-theme"',
            f'data-topology="{html.escape(topology_url, quote=True)}"',
            f'data-controls="{controls}"',
            f'data-controls-open="{controls_open}"',
            f'style="height: {height};"',
        ]
        if stylesheet_url:
            attributes.insert(3, f'data-stylesheet="{html.escape(stylesheet_url, quote=True)}"')
        if attention is not None:
            attention_json = json.dumps(attention, separators=(",", ":"), sort_keys=True)
            attributes.append(f'data-attention="{html.escape(attention_json, quote=True)}"')
        helper_lines_json = json.dumps(helper_lines, separators=(",", ":"), sort_keys=True)
        attributes.append(f'data-helper-lines="{html.escape(helper_lines_json, quote=True)}"')
        if selected_layer_ids is not None:
            selected_layer_ids_json = json.dumps(selected_layer_ids, separators=(",", ":"))
            attributes.append(f'data-selected-layer-ids="{html.escape(selected_layer_ids_json, quote=True)}"')

        caption = f'<figcaption class="topoviewer-title">{html.escape(title)}</figcaption>\n' if title else ""
        return (
            f'<figure class="topoviewer-figure" style="--topoviewer-width: {width};">\n'
            f"{caption}"
            f'<div {" ".join(attributes)}></div>\n'
            "</figure>"
        )

    def on_config(self, config):
        _append_unique(config, "extra_css", self._asset_uri("topoviewer-embed.css"))
        _append_unique(config, "extra_css", self._asset_uri("topoviewer-mkdocs.css"))
        _append_unique(config, "extra_javascript", self._asset_uri("topoviewer-embed.iife.js"))
        return config

    def on_files(self, files_collection, config):
        asset_root = files("mkdocs_topoviewer.assets")
        for asset_name in ASSET_FILES:
            asset = asset_root.joinpath(asset_name)
            files_collection.append(
                File.generated(
                    config,
                    self._asset_uri(asset_name),
                    content=asset.read_bytes(),
                )
            )
        return files_collection

    def on_page_markdown(self, markdown, page, config, files):
        ordinal = 0

        def replace(match):
            nonlocal ordinal
            ordinal += 1
            prefix = match.group(1)
            indent = match.group(2)
            raw_config = textwrap.dedent(match.group(3))
            fence_config = _load_fence_config(raw_config, page)
            embed = self._embed_html(fence_config, page, ordinal)
            if indent:
                embed = textwrap.indent(embed, indent)
            return f"{prefix}{embed}"

        return FENCE_RE.sub(replace, markdown)
