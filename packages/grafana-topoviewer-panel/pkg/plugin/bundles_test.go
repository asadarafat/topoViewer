package plugin

import (
	"context"
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
	if index.Bundles[0].TopologyPath != filepath.Join(explicitRoot, "second.topo.tv.yaml") {
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
