package plugin

import (
	"os"
	"path/filepath"
	"testing"
)

func writeTestFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("write test file %s: %v", path, err)
	}
}

func TestDiscoverBundlesRequiresCanonicalSuffixes(t *testing.T) {
	root := t.TempDir()
	bundleRoot := filepath.Join(root, "branch-core")
	if err := os.MkdirAll(bundleRoot, 0o755); err != nil {
		t.Fatal(err)
	}

	writeTestFile(t, filepath.Join(bundleRoot, "branch-core.topo.tv.yaml"), "graph:\n  id: branch-core\n")
	writeTestFile(t, filepath.Join(bundleRoot, "branch-core.style.tv.yaml"), "layout:\n  mode: manual\n")
	writeTestFile(t, filepath.Join(bundleRoot, "branch-core.mapper.tv.yaml"), "version: 1\n")

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
