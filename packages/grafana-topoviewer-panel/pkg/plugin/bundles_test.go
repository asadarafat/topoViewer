package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func writeTestFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("write test file %s: %v", path, err)
	}
}

func writeValidTestBundle(t *testing.T, root string, id string) string {
	t.Helper()
	bundleRoot := filepath.Join(root, id)
	if err := os.MkdirAll(bundleRoot, 0o755); err != nil {
		t.Fatal(err)
	}
	writeTestFile(t, filepath.Join(bundleRoot, id+".topo.tv.yaml"), "graph:\n  id: "+id+"\n")
	writeTestFile(t, filepath.Join(bundleRoot, id+".style.tv.yaml"), "layout:\n  mode: manual\n")
	writeTestFile(t, filepath.Join(bundleRoot, id+".mapper.tv.yaml"), "version: 1\nmappings: []\n")
	return bundleRoot
}

func writeHarnessExportedTestBundle(t *testing.T, root string, id string) string {
	t.Helper()
	bundleRoot := filepath.Join(root, id)
	if err := os.MkdirAll(bundleRoot, 0o755); err != nil {
		t.Fatal(err)
	}
	writeTestFile(t, filepath.Join(bundleRoot, id+".topo.tv.yaml"), ""+
		"graph:\n"+
		"  id: "+id+"\n"+
		"  layers:\n"+
		"    - id: underlay\n"+
		"      name: Underlay\n"+
		"  nodes:\n"+
		"    - id: PE1\n"+
		"      name: PE1\n"+
		"      layers: [underlay]\n"+
		"      position: [120, 140]\n"+
		"    - id: P1\n"+
		"      name: P1\n"+
		"      layers: [underlay]\n"+
		"      position: [320, 140]\n"+
		"  links:\n"+
		"    - id: PE1-P1\n"+
		"      source: PE1\n"+
		"      target: P1\n"+
		"      layers: [underlay]\n")
	writeTestFile(t, filepath.Join(bundleRoot, id+".style.tv.yaml"), ""+
		"layout:\n"+
		"  mode: manual\n"+
		"  width: 480\n"+
		"  height: 280\n"+
		"stylesheet:\n"+
		"  - selector: node\n"+
		"    style:\n"+
		"      shape: rectangle\n"+
		"      width: 80\n"+
		"      height: 48\n"+
		"  - selector: link\n"+
		"    style:\n"+
		"      lineWidth: 3\n"+
		"      lineColor: \"#4caf50\"\n")
	writeTestFile(t, filepath.Join(bundleRoot, id+".mapper.tv.yaml"), ""+
		"version: 1\n"+
		"identity:\n"+
		"  sourceId: "+id+"\n"+
		"  sourceIdLabel: source_id\n"+
		"rules:\n"+
		"  - id: link-state\n"+
		"    metric: topoviewer_link_up\n"+
		"    select: link\n"+
		"    join: link_id\n"+
		"    value: up\n"+
		"    states:\n"+
		"      down: \"==0\"\n"+
		"    style:\n"+
		"      default:\n"+
		"        label: UP\n"+
		"        lineColor: \"#4caf50\"\n"+
		"      down:\n"+
		"        label: DOWN\n"+
		"        lineColor: \"#d32f2f\"\n"+
		"        lineStyle: dashed\n")
	return bundleRoot
}

func diagnosticCodes(diagnostics []diagnostic) []string {
	codes := make([]string, 0, len(diagnostics))
	for _, diagnostic := range diagnostics {
		codes = append(codes, diagnostic.Code)
	}
	return codes
}

func requireDiagnosticCode(t *testing.T, diagnostics []diagnostic, code string) {
	t.Helper()
	for _, diagnostic := range diagnostics {
		if diagnostic.Code == code {
			return
		}
	}
	t.Fatalf("expected diagnostic code %q, got %#v", code, diagnosticCodes(diagnostics))
}

func callBundleResource(t *testing.T, path string, rawURL string) *backend.CallResourceResponse {
	t.Helper()
	var response *backend.CallResourceResponse
	handler := &bundleResourceHandler{}
	err := handler.CallResource(
		context.Background(),
		&backend.CallResourceRequest{
			Path: path,
			URL:  rawURL,
		},
		backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
			response = resp
			return nil
		}),
	)
	if err != nil {
		t.Fatal(err)
	}
	if response == nil {
		t.Fatal("expected resource response")
	}
	return response
}

func TestDiscoverBundlesRequiresCanonicalSuffixes(t *testing.T) {
	root := t.TempDir()
	writeValidTestBundle(t, root, "branch-core")

	index, err := discoverBundles(root, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(index.Diagnostics) != 0 {
		t.Fatalf("expected no diagnostics, got %#v", index.Diagnostics)
	}
	if len(index.Bundles) != 1 {
		t.Fatalf("expected one bundle, got %d", len(index.Bundles))
	}
	if index.Bundles[0].ID != "branch-core" {
		t.Fatalf("expected branch-core bundle, got %q", index.Bundles[0].ID)
	}
}

func TestBundleResourceReadsHarnessExportedCanonicalBundle(t *testing.T) {
	root := t.TempDir()
	t.Setenv("TOPOVIEWER_ALLOWED_BUNDLE_ROOTS", root)
	bundleID := "harness-exported-branch"
	writeHarnessExportedTestBundle(t, root, bundleID)

	indexResponse := callBundleResource(t, "bundles", "http://topoviewer.local/bundles?root="+url.QueryEscape(root))
	if indexResponse.Status != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, indexResponse.Status, string(indexResponse.Body))
	}
	var index bundleIndexResponse
	if err := json.Unmarshal(indexResponse.Body, &index); err != nil {
		t.Fatalf("unmarshal bundle index: %v", err)
	}
	if len(index.Diagnostics) != 0 {
		t.Fatalf("expected no diagnostics, got %#v", index.Diagnostics)
	}
	if len(index.Bundles) != 1 || index.Bundles[0].ID != bundleID {
		t.Fatalf("expected discovered harness-exported bundle, got %#v", index.Bundles)
	}
	if index.Bundles[0].TopologyPath != bundleID+"/"+bundleID+".topo.tv.yaml" {
		t.Fatalf("expected canonical logical topology path, got %q", index.Bundles[0].TopologyPath)
	}

	readResponse := callBundleResource(t, "bundle", "http://topoviewer.local/bundle?root="+url.QueryEscape(root)+"&id="+url.QueryEscape(bundleID))
	if readResponse.Status != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, readResponse.Status, string(readResponse.Body))
	}
	var payload bundleResponse
	if err := json.Unmarshal(readResponse.Body, &payload); err != nil {
		t.Fatalf("unmarshal bundle payload: %v", err)
	}
	if payload.Bundle.ID != bundleID {
		t.Fatalf("expected payload bundle %q, got %q", bundleID, payload.Bundle.ID)
	}
	if !strings.Contains(payload.TopologyYAML, "id: "+bundleID) {
		t.Fatalf("expected topology YAML from harness-exported bundle, got %q", payload.TopologyYAML)
	}
	if !strings.Contains(payload.StylesheetYAML, "lineColor: \"#4caf50\"") {
		t.Fatalf("expected stylesheet YAML from harness-exported bundle, got %q", payload.StylesheetYAML)
	}
	if !strings.Contains(payload.MapperYAML, "rules:") || !strings.Contains(payload.MapperYAML, "id: link-state") {
		t.Fatalf("expected mapper YAML from harness-exported bundle, got %q", payload.MapperYAML)
	}
	body := string(readResponse.Body)
	if strings.Contains(body, root) || strings.Contains(body, filepath.ToSlash(root)) {
		t.Fatalf("response leaked mounted filesystem path %q: %s", root, body)
	}
}

func TestDiscoverBundlesReportsIncompleteBundle(t *testing.T) {
	root := t.TempDir()
	bundleRoot := filepath.Join(root, "missing-mapper")
	if err := os.MkdirAll(bundleRoot, 0o755); err != nil {
		t.Fatal(err)
	}

	writeTestFile(t, filepath.Join(bundleRoot, "missing-mapper.topo.tv.yaml"), "graph:\n  id: missing-mapper\n")
	writeTestFile(t, filepath.Join(bundleRoot, "missing-mapper.style.tv.yaml"), "layout:\n  mode: manual\n")

	index, err := discoverBundles(root, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(index.Bundles) != 0 {
		t.Fatalf("expected incomplete bundle to be omitted, got %d bundles", len(index.Bundles))
	}
	if len(index.Diagnostics) != 1 {
		t.Fatalf("expected one diagnostic, got %#v", index.Diagnostics)
	}
	if index.Diagnostics[0].Code != "bundle-file-missing" {
		t.Fatalf("expected missing-file diagnostic, got %q", index.Diagnostics[0].Code)
	}
}

func TestDiscoverBundlesReportsDuplicateCanonicalSuffixFiles(t *testing.T) {
	root := t.TempDir()
	bundleRoot := writeValidTestBundle(t, root, "duplicate-files")
	writeTestFile(t, filepath.Join(bundleRoot, "extra.topo.tv.yaml"), "graph:\n  id: duplicate\n")

	index, err := discoverBundles(root, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(index.Bundles) != 0 {
		t.Fatalf("expected duplicate-file bundle to be omitted, got %d bundles", len(index.Bundles))
	}
	requireDiagnosticCode(t, index.Diagnostics, "bundle-file-duplicate")
}

func TestDiscoverBundlesUsesManifestOverride(t *testing.T) {
	root := t.TempDir()
	explicitRoot := filepath.Join(root, "explicit")
	if err := os.MkdirAll(explicitRoot, 0o755); err != nil {
		t.Fatal(err)
	}

	writeTestFile(t, filepath.Join(explicitRoot, "first.topo.tv.yaml"), "graph:\n  id: ignored\n")
	writeTestFile(t, filepath.Join(explicitRoot, "second.topo.tv.yaml"), "graph:\n  id: used\n")
	writeTestFile(t, filepath.Join(explicitRoot, "first.style.tv.yaml"), "layout:\n  mode: manual\n")
	writeTestFile(t, filepath.Join(explicitRoot, "first.mapper.tv.yaml"), "version: 1\nmappings: []\n")
	manifestPath := filepath.Join(root, "bundles.yaml")
	writeTestFile(t, manifestPath, ""+
		"version: \"0.1\"\n"+
		"bundles:\n"+
		"  - id: explicit-core\n"+
		"    name: Explicit Core\n"+
		"    topology: explicit/second.topo.tv.yaml\n"+
		"    stylesheet: explicit/first.style.tv.yaml\n"+
		"    mapper: explicit/first.mapper.tv.yaml\n")

	index, err := discoverBundles(root, manifestPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(index.Diagnostics) != 0 {
		t.Fatalf("expected no diagnostics, got %#v", index.Diagnostics)
	}
	if len(index.Bundles) != 1 {
		t.Fatalf("expected one manifest bundle, got %d", len(index.Bundles))
	}
	if index.Bundles[0].ID != "explicit-core" {
		t.Fatalf("expected explicit-core bundle, got %q", index.Bundles[0].ID)
	}
	if index.Bundles[0].Name != "Explicit Core" {
		t.Fatalf("expected manifest name, got %q", index.Bundles[0].Name)
	}
	if index.Bundles[0].TopologyPath != "explicit/second.topo.tv.yaml" {
		t.Fatalf("manifest should select explicit topology path, got %q", index.Bundles[0].TopologyPath)
	}

	response, err := readBundle(root, manifestPath, "explicit-core")
	if err != nil {
		t.Fatal(err)
	}
	if response.TopologyYAML != "graph:\n  id: used\n" {
		t.Fatalf("expected manifest-selected topology YAML, got %q", response.TopologyYAML)
	}
}

func TestBundleResourceRootAllowlist(t *testing.T) {
	t.Run("uses configured default when query root is empty", func(t *testing.T) {
		root := t.TempDir()
		t.Setenv("TOPOVIEWER_BUNDLE_ROOT", root)
		writeValidTestBundle(t, root, "default-root")

		response := callBundleResource(t, "bundles", "http://topoviewer.local/bundles")

		if response.Status != http.StatusOK {
			t.Fatalf("expected status %d, got %d: %s", http.StatusOK, response.Status, string(response.Body))
		}
		if strings.Contains(string(response.Body), root) || strings.Contains(string(response.Body), filepath.ToSlash(root)) {
			t.Fatalf("response leaked default bundle root %q: %s", root, string(response.Body))
		}
	})

	t.Run("rejects root outside allowlist", func(t *testing.T) {
		allowedRoot := t.TempDir()
		outsideRoot := t.TempDir()
		t.Setenv("TOPOVIEWER_ALLOWED_BUNDLE_ROOTS", allowedRoot)

		response := callBundleResource(t, "bundles", "http://topoviewer.local/bundles?root="+url.QueryEscape(outsideRoot))

		if response.Status != http.StatusBadRequest {
			t.Fatalf("expected status %d, got %d: %s", http.StatusBadRequest, response.Status, string(response.Body))
		}
		body := string(response.Body)
		if !strings.Contains(body, "invalid-bundle-root") {
			t.Fatalf("expected invalid-bundle-root response, got %s", body)
		}
		if strings.Contains(body, allowedRoot) || strings.Contains(body, outsideRoot) {
			t.Fatalf("response leaked root paths: %s", body)
		}
	})

	t.Run("rejects slash root", func(t *testing.T) {
		allowedRoot := t.TempDir()
		t.Setenv("TOPOVIEWER_ALLOWED_BUNDLE_ROOTS", allowedRoot)

		response := callBundleResource(t, "bundles", "http://topoviewer.local/bundles?root="+url.QueryEscape(string(filepath.Separator)))

		if response.Status != http.StatusBadRequest {
			t.Fatalf("expected status %d, got %d: %s", http.StatusBadRequest, response.Status, string(response.Body))
		}
		if !strings.Contains(string(response.Body), "invalid-bundle-root") {
			t.Fatalf("expected invalid-bundle-root response, got %s", string(response.Body))
		}
	})

	t.Run("rejects relative root outside allowlist", func(t *testing.T) {
		allowedRoot := t.TempDir()
		t.Setenv("TOPOVIEWER_ALLOWED_BUNDLE_ROOTS", allowedRoot)

		response := callBundleResource(t, "bundles", "http://topoviewer.local/bundles?root=relative-bundles")

		if response.Status != http.StatusBadRequest {
			t.Fatalf("expected status %d, got %d: %s", http.StatusBadRequest, response.Status, string(response.Body))
		}
		if !strings.Contains(string(response.Body), "invalid-bundle-root") {
			t.Fatalf("expected invalid-bundle-root response, got %s", string(response.Body))
		}
	})
}

func TestDiscoverBundlesRejectsManifestTraversalAndSymlinkEscape(t *testing.T) {
	root := t.TempDir()
	outsideRoot := t.TempDir()
	outsideManifest := filepath.Join(outsideRoot, "outside.yaml")
	writeTestFile(t, outsideManifest, "version: \"0.1\"\nbundles: []\n")

	if _, err := resolveManifestPath(root, "../outside.yaml"); err == nil {
		t.Fatal("expected relative manifest traversal to be rejected")
	}
	if _, err := resolveManifestPath(root, outsideManifest); err == nil {
		t.Fatal("expected absolute manifest outside root to be rejected")
	}

	manifestSymlink := filepath.Join(root, "manifest.yaml")
	if err := os.Symlink(outsideManifest, manifestSymlink); err != nil {
		t.Skipf("symlinks are not available: %v", err)
	}
	index, err := discoverBundles(root, manifestSymlink)
	if err != nil {
		t.Fatal(err)
	}
	requireDiagnosticCode(t, index.Diagnostics, "bundle-manifest-read-failed")
}

func TestBundleResourceRejectsEncodedManifestTraversal(t *testing.T) {
	root := t.TempDir()
	t.Setenv("TOPOVIEWER_ALLOWED_BUNDLE_ROOTS", root)

	var response *backend.CallResourceResponse
	handler := &bundleResourceHandler{}
	err := handler.CallResource(
		context.Background(),
		&backend.CallResourceRequest{
			Path: "bundles",
			URL:  "http://topoviewer.local/bundles?root=" + url.QueryEscape(root) + "&manifest=" + url.QueryEscape("../outside.yaml"),
		},
		backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
			response = resp
			return nil
		}),
	)
	if err != nil {
		t.Fatal(err)
	}
	if response == nil {
		t.Fatal("expected resource response")
	}
	if response.Status != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d: %s", http.StatusBadRequest, response.Status, string(response.Body))
	}
	if !strings.Contains(string(response.Body), "invalid-bundle-manifest") {
		t.Fatalf("expected invalid-bundle-manifest response, got %s", string(response.Body))
	}
	if strings.Contains(string(response.Body), root) {
		t.Fatalf("response leaked bundle root %q: %s", root, string(response.Body))
	}
}

func TestBundleResourceRedactsMountedFilesystemPaths(t *testing.T) {
	root := t.TempDir()
	t.Setenv("TOPOVIEWER_ALLOWED_BUNDLE_ROOTS", root)

	writeValidTestBundle(t, root, "branch-core")
	incompleteRoot := filepath.Join(root, "missing-mapper")
	if err := os.MkdirAll(incompleteRoot, 0o755); err != nil {
		t.Fatal(err)
	}
	writeTestFile(t, filepath.Join(incompleteRoot, "missing-mapper.topo.tv.yaml"), "graph:\n  id: missing-mapper\n")
	writeTestFile(t, filepath.Join(incompleteRoot, "missing-mapper.style.tv.yaml"), "layout:\n  mode: manual\n")

	var response *backend.CallResourceResponse
	handler := &bundleResourceHandler{}
	err := handler.CallResource(
		context.Background(),
		&backend.CallResourceRequest{
			Path: "bundles",
			URL:  "http://topoviewer.local/bundles?root=" + url.QueryEscape(root),
		},
		backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
			response = resp
			return nil
		}),
	)
	if err != nil {
		t.Fatal(err)
	}
	if response == nil {
		t.Fatal("expected resource response")
	}
	body := string(response.Body)
	if strings.Contains(body, root) {
		t.Fatalf("response leaked bundle root %q: %s", root, body)
	}
	if strings.Contains(body, filepath.ToSlash(root)) {
		t.Fatalf("response leaked slash-normalized bundle root %q: %s", filepath.ToSlash(root), body)
	}
	if !strings.Contains(body, `"root":"."`) {
		t.Fatalf("expected logical response root, got %s", body)
	}
	if !strings.Contains(body, `"topologyPath":"branch-core/branch-core.topo.tv.yaml"`) {
		t.Fatalf("expected logical topology path, got %s", body)
	}
	if !strings.Contains(body, `"path":"missing-mapper"`) {
		t.Fatalf("expected logical diagnostic path, got %s", body)
	}
}

func TestBundleResourceRedactsReadErrors(t *testing.T) {
	root := t.TempDir()
	t.Setenv("TOPOVIEWER_ALLOWED_BUNDLE_ROOTS", root)

	bundleRoot := writeValidTestBundle(t, root, "non-utf8")
	if err := os.WriteFile(filepath.Join(bundleRoot, "non-utf8.topo.tv.yaml"), []byte{0xff, 0xfe, 0xfd}, 0o644); err != nil {
		t.Fatal(err)
	}

	var response *backend.CallResourceResponse
	handler := &bundleResourceHandler{}
	err := handler.CallResource(
		context.Background(),
		&backend.CallResourceRequest{
			Path: "bundle",
			URL:  "http://topoviewer.local/bundle?root=" + url.QueryEscape(root) + "&id=non-utf8",
		},
		backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
			response = resp
			return nil
		}),
	)
	if err != nil {
		t.Fatal(err)
	}
	if response == nil {
		t.Fatal("expected resource response")
	}
	body := string(response.Body)
	if response.Status != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d: %s", http.StatusInternalServerError, response.Status, body)
	}
	if strings.Contains(body, root) || strings.Contains(body, filepath.ToSlash(root)) {
		t.Fatalf("response leaked bundle root %q: %s", root, body)
	}
	if !strings.Contains(body, "bundle-root") && !strings.Contains(body, "redacted-path") {
		t.Fatalf("expected redacted path marker, got %s", body)
	}
}

func TestDiscoverBundlesReportsMalformedManifestYAML(t *testing.T) {
	root := t.TempDir()
	manifestPath := filepath.Join(root, "bundles.yaml")
	writeTestFile(t, manifestPath, "version: [\n")

	index, err := discoverBundles(root, manifestPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(index.Bundles) != 0 {
		t.Fatalf("expected malformed manifest to omit bundles, got %d bundles", len(index.Bundles))
	}
	requireDiagnosticCode(t, index.Diagnostics, "bundle-manifest-invalid")
}

func TestDiscoverBundlesReportsManifestDuplicateIDs(t *testing.T) {
	root := t.TempDir()
	bundleRoot := filepath.Join(root, "bundle")
	if err := os.MkdirAll(bundleRoot, 0o755); err != nil {
		t.Fatal(err)
	}
	writeTestFile(t, filepath.Join(bundleRoot, "bundle.topo.tv.yaml"), "graph:\n  id: bundle\n")
	writeTestFile(t, filepath.Join(bundleRoot, "bundle.style.tv.yaml"), "layout:\n  mode: manual\n")
	writeTestFile(t, filepath.Join(bundleRoot, "bundle.mapper.tv.yaml"), "version: 1\nmappings: []\n")
	manifestPath := filepath.Join(root, "bundles.yaml")
	writeTestFile(t, manifestPath, ""+
		"version: \"0.1\"\n"+
		"bundles:\n"+
		"  - id: duplicate\n"+
		"    topology: bundle/bundle.topo.tv.yaml\n"+
		"    stylesheet: bundle/bundle.style.tv.yaml\n"+
		"    mapper: bundle/bundle.mapper.tv.yaml\n"+
		"  - id: duplicate\n"+
		"    topology: bundle/bundle.topo.tv.yaml\n"+
		"    stylesheet: bundle/bundle.style.tv.yaml\n"+
		"    mapper: bundle/bundle.mapper.tv.yaml\n")

	index, err := discoverBundles(root, manifestPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(index.Bundles) != 1 {
		t.Fatalf("expected only one duplicate bundle to be retained, got %d", len(index.Bundles))
	}
	if len(index.Diagnostics) != 1 || index.Diagnostics[0].Code != "bundle-id-duplicate" {
		t.Fatalf("expected duplicate-id diagnostic, got %#v", index.Diagnostics)
	}
}

func TestDiscoverBundlesRejectsSymlinkedBundleFilesOutsideRoot(t *testing.T) {
	root := t.TempDir()
	outsideRoot := t.TempDir()
	outsideTopology := filepath.Join(outsideRoot, "escaped.topo.tv.yaml")
	writeTestFile(t, outsideTopology, "graph:\n  id: escaped\n")

	bundleRoot := filepath.Join(root, "escaped")
	if err := os.MkdirAll(bundleRoot, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outsideTopology, filepath.Join(bundleRoot, "escaped.topo.tv.yaml")); err != nil {
		t.Skipf("symlinks are not available: %v", err)
	}
	writeTestFile(t, filepath.Join(bundleRoot, "escaped.style.tv.yaml"), "layout:\n  mode: manual\n")
	writeTestFile(t, filepath.Join(bundleRoot, "escaped.mapper.tv.yaml"), "version: 1\nmappings: []\n")

	index, err := discoverBundles(root, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(index.Bundles) != 0 {
		t.Fatalf("expected symlink-escaped bundle to be omitted, got %d bundles", len(index.Bundles))
	}
	requireDiagnosticCode(t, index.Diagnostics, "bundle-file-invalid")
}

func TestDiscoverBundlesRejectsEmptyOversizedAndLargeBundleDirectories(t *testing.T) {
	t.Run("empty canonical file", func(t *testing.T) {
		root := t.TempDir()
		bundleRoot := writeValidTestBundle(t, root, "empty-file")
		writeTestFile(t, filepath.Join(bundleRoot, "empty-file.mapper.tv.yaml"), "")

		index, err := discoverBundles(root, "")
		if err != nil {
			t.Fatal(err)
		}
		requireDiagnosticCode(t, index.Diagnostics, "bundle-file-invalid")
	})

	t.Run("oversized canonical file", func(t *testing.T) {
		root := t.TempDir()
		bundleRoot := writeValidTestBundle(t, root, "oversized-file")
		writeTestFile(t, filepath.Join(bundleRoot, "oversized-file.style.tv.yaml"), strings.Repeat("x", maxBundleFileSize+1))

		index, err := discoverBundles(root, "")
		if err != nil {
			t.Fatal(err)
		}
		requireDiagnosticCode(t, index.Diagnostics, "bundle-file-invalid")
	})

	t.Run("too many files in one bundle directory", func(t *testing.T) {
		root := t.TempDir()
		bundleRoot := writeValidTestBundle(t, root, "too-many-files")
		for index := 0; index < maxBundleDirectoryFiles; index += 1 {
			writeTestFile(t, filepath.Join(bundleRoot, fmt.Sprintf("extra-%03d.txt", index)), "ignored\n")
		}

		index, err := discoverBundles(root, "")
		if err != nil {
			t.Fatal(err)
		}
		requireDiagnosticCode(t, index.Diagnostics, "bundle-directory-too-large")
	})

	t.Run("nested directories are ignored during suffix discovery", func(t *testing.T) {
		root := t.TempDir()
		bundleRoot := writeValidTestBundle(t, root, "nested-safe")
		nestedRoot := filepath.Join(bundleRoot, "nested")
		if err := os.MkdirAll(nestedRoot, 0o755); err != nil {
			t.Fatal(err)
		}
		writeTestFile(t, filepath.Join(nestedRoot, "nested-safe.topo.tv.yaml"), "graph:\n  id: ignored\n")

		index, err := discoverBundles(root, "")
		if err != nil {
			t.Fatal(err)
		}
		if len(index.Diagnostics) != 0 {
			t.Fatalf("expected nested directory to be ignored without diagnostics, got %#v", index.Diagnostics)
		}
		if len(index.Bundles) != 1 {
			t.Fatalf("expected valid top-level bundle, got %d", len(index.Bundles))
		}
	})
}

func TestDiscoverBundlesBoundsRootDirectoryCount(t *testing.T) {
	root := t.TempDir()
	for index := 0; index <= maxBundleDirectories; index += 1 {
		if err := os.MkdirAll(filepath.Join(root, fmt.Sprintf("bundle-%04d", index)), 0o755); err != nil {
			t.Fatal(err)
		}
	}

	index, err := discoverBundles(root, "")
	if err != nil {
		t.Fatal(err)
	}
	requireDiagnosticCode(t, index.Diagnostics, "bundle-root-too-large")
}

func TestReadBundleRejectsNonUTF8CanonicalFiles(t *testing.T) {
	root := t.TempDir()
	bundleRoot := writeValidTestBundle(t, root, "non-utf8")
	if err := os.WriteFile(filepath.Join(bundleRoot, "non-utf8.topo.tv.yaml"), []byte{0xff, 0xfe, 0xfd}, 0o644); err != nil {
		t.Fatal(err)
	}

	_, err := readBundle(root, "", "non-utf8")
	if err == nil || !strings.Contains(err.Error(), "valid UTF-8") {
		t.Fatalf("expected UTF-8 read error, got %v", err)
	}
}
