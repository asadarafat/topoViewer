package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"go.yaml.in/yaml/v2"
)

const (
	defaultBundleRoot = "/etc/topoviewer/bundles"
	maxBundleFileSize = 2 * 1024 * 1024
)

type severity string

const (
	severityError   severity = "error"
	severityWarning severity = "warning"
	severityInfo    severity = "info"
)

type diagnostic struct {
	Severity severity `json:"severity"`
	Code     string   `json:"code"`
	Message  string   `json:"message"`
	BundleID string   `json:"bundleId,omitempty"`
	Path     string   `json:"path,omitempty"`
}

type mountedBundle struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Root           string `json:"root"`
	TopologyPath   string `json:"topologyPath"`
	StylesheetPath string `json:"stylesheetPath"`
	MapperPath     string `json:"mapperPath"`
}

type bundleIndexResponse struct {
	Root         string          `json:"root"`
	ManifestPath string          `json:"manifestPath,omitempty"`
	Bundles      []mountedBundle `json:"bundles"`
	Diagnostics  []diagnostic    `json:"diagnostics"`
}

type bundleResponse struct {
	Bundle         mountedBundle `json:"bundle"`
	TopologyYAML   string        `json:"topologyYaml"`
	StylesheetYAML string        `json:"stylesheetYaml"`
	MapperYAML     string        `json:"mapperYaml"`
	Diagnostics    []diagnostic  `json:"diagnostics"`
}

type bundleResourceHandler struct{}

type bundleManifest struct {
	Version string                `yaml:"version"`
	Bundles []bundleManifestEntry `yaml:"bundles"`
}

type bundleManifestEntry struct {
	ID         string `yaml:"id"`
	Name       string `yaml:"name"`
	Topology   string `yaml:"topology"`
	Stylesheet string `yaml:"stylesheet"`
	Mapper     string `yaml:"mapper"`
	Default    bool   `yaml:"default"`
}

func NewBundleResourceHandler() backend.CallResourceHandler {
	return &bundleResourceHandler{}
}

func (handler *bundleResourceHandler) CallResource(
	ctx context.Context,
	request *backend.CallResourceRequest,
	sender backend.CallResourceResponseSender,
) error {
	if ctx.Err() != nil {
		return ctx.Err()
	}

	parsedURL, err := url.Parse(request.URL)
	if err != nil {
		return sendError(sender, http.StatusBadRequest, "invalid-resource-url", fmt.Sprintf("Invalid resource URL: %v.", err))
	}

	switch strings.Trim(request.Path, "/") {
	case "bundles":
		root, rootErr := resolveBundleRoot(parsedURL.Query().Get("root"))
		if rootErr != nil {
			return sendError(sender, http.StatusBadRequest, "invalid-bundle-root", rootErr.Error())
		}
		manifestPath, manifestErr := resolveManifestPath(root, parsedURL.Query().Get("manifest"))
		if manifestErr != nil {
			return sendError(sender, http.StatusBadRequest, "invalid-bundle-manifest", manifestErr.Error())
		}
		index, discoverErr := discoverBundles(root, manifestPath)
		if discoverErr != nil {
			return sendError(sender, http.StatusInternalServerError, "bundle-discovery-failed", discoverErr.Error())
		}
		return sendJSON(sender, http.StatusOK, index)
	case "bundle":
		root, rootErr := resolveBundleRoot(parsedURL.Query().Get("root"))
		if rootErr != nil {
			return sendError(sender, http.StatusBadRequest, "invalid-bundle-root", rootErr.Error())
		}
		bundleID := strings.TrimSpace(parsedURL.Query().Get("id"))
		if bundleID == "" {
			return sendError(sender, http.StatusBadRequest, "missing-bundle-id", "Query parameter id is required.")
		}
		manifestPath, manifestErr := resolveManifestPath(root, parsedURL.Query().Get("manifest"))
		if manifestErr != nil {
			return sendError(sender, http.StatusBadRequest, "invalid-bundle-manifest", manifestErr.Error())
		}
		response, bundleErr := readBundle(root, manifestPath, bundleID)
		if bundleErr != nil {
			status := http.StatusInternalServerError
			if errors.Is(bundleErr, os.ErrNotExist) {
				status = http.StatusNotFound
			}
			return sendError(sender, status, "bundle-read-failed", bundleErr.Error())
		}
		return sendJSON(sender, http.StatusOK, response)
	default:
		return sendError(sender, http.StatusNotFound, "unknown-resource", fmt.Sprintf("Unknown TopoViewer resource path %q.", request.Path))
	}
}

func sendJSON(sender backend.CallResourceResponseSender, status int, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return sender.Send(&backend.CallResourceResponse{
		Status: status,
		Headers: map[string][]string{
			"content-type": {"application/json; charset=utf-8"},
		},
		Body: body,
	})
}

func sendError(sender backend.CallResourceResponseSender, status int, code string, message string) error {
	return sendJSON(sender, status, map[string]any{
		"diagnostics": []diagnostic{{
			Severity: severityError,
			Code:     code,
			Message:  message,
		}},
	})
}

func resolveBundleRoot(requestedRoot string) (string, error) {
	defaultRoot := strings.TrimSpace(os.Getenv("TOPOVIEWER_BUNDLE_ROOT"))
	if defaultRoot == "" {
		defaultRoot = defaultBundleRoot
	}
	root := strings.TrimSpace(requestedRoot)
	if root == "" {
		root = defaultRoot
	}
	cleanRoot, err := filepath.Abs(filepath.Clean(root))
	if err != nil {
		return "", err
	}
	if !isAllowedRoot(cleanRoot, defaultRoot) {
		return "", fmt.Errorf("bundle root %q is not allowed; mount bundles under %q or set TOPOVIEWER_ALLOWED_BUNDLE_ROOTS", cleanRoot, defaultRoot)
	}
	return cleanRoot, nil
}

func resolveManifestPath(root string, requestedManifest string) (string, error) {
	manifest := strings.TrimSpace(requestedManifest)
	if manifest == "" {
		return "", nil
	}
	var cleanManifest string
	if filepath.IsAbs(manifest) {
		cleanManifest = filepath.Clean(manifest)
	} else {
		cleanManifest = filepath.Join(root, manifest)
	}
	absoluteManifest, err := filepath.Abs(cleanManifest)
	if err != nil {
		return "", err
	}
	if !pathWithinRoot(root, absoluteManifest) {
		return "", fmt.Errorf("bundle manifest %q must be under bundle root %q", absoluteManifest, root)
	}
	return absoluteManifest, nil
}

func isAllowedRoot(root string, defaultRoot string) bool {
	allowedRoots := []string{defaultRoot}
	if fromEnv := strings.TrimSpace(os.Getenv("TOPOVIEWER_ALLOWED_BUNDLE_ROOTS")); fromEnv != "" {
		allowedRoots = append(allowedRoots, strings.Split(fromEnv, string(os.PathListSeparator))...)
	}
	for _, allowed := range allowedRoots {
		cleanAllowed, err := filepath.Abs(filepath.Clean(strings.TrimSpace(allowed)))
		if err != nil || cleanAllowed == "" {
			continue
		}
		if root == cleanAllowed {
			return true
		}
	}
	return false
}

func pathWithinRoot(root string, candidate string) bool {
	cleanRoot, err := filepath.Abs(filepath.Clean(root))
	if err != nil {
		return false
	}
	cleanCandidate, err := filepath.Abs(filepath.Clean(candidate))
	if err != nil {
		return false
	}
	rel, err := filepath.Rel(cleanRoot, cleanCandidate)
	if err != nil {
		return false
	}
	return rel == "." || (!strings.HasPrefix(rel, ".."+string(filepath.Separator)) && rel != "..")
}

func discoverBundles(root string, manifestPath string) (bundleIndexResponse, error) {
	if manifestPath != "" {
		return discoverBundlesFromManifest(root, manifestPath)
	}

	entries, err := os.ReadDir(root)
	if err != nil {
		return bundleIndexResponse{}, err
	}

	response := bundleIndexResponse{
		Root:        root,
		Bundles:     []mountedBundle{},
		Diagnostics: []diagnostic{},
	}

	for _, entry := range entries {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		bundleRoot := filepath.Join(root, entry.Name())
		bundle, diagnostics, err := discoverBundle(bundleRoot, entry.Name())
		if err != nil {
			return bundleIndexResponse{}, err
		}
		response.Diagnostics = append(response.Diagnostics, diagnostics...)
		if bundle != nil {
			response.Bundles = append(response.Bundles, *bundle)
		}
	}

	sort.SliceStable(response.Bundles, func(left int, right int) bool {
		return response.Bundles[left].ID < response.Bundles[right].ID
	})
	sort.SliceStable(response.Diagnostics, func(left int, right int) bool {
		if response.Diagnostics[left].BundleID == response.Diagnostics[right].BundleID {
			return response.Diagnostics[left].Code < response.Diagnostics[right].Code
		}
		return response.Diagnostics[left].BundleID < response.Diagnostics[right].BundleID
	})

	return response, nil
}

func discoverBundlesFromManifest(root string, manifestPath string) (bundleIndexResponse, error) {
	response := bundleIndexResponse{
		Root:         root,
		ManifestPath: manifestPath,
		Bundles:      []mountedBundle{},
		Diagnostics:  []diagnostic{},
	}

	content, err := readLimitedTextFile(manifestPath)
	if err != nil {
		response.Diagnostics = append(response.Diagnostics, diagnostic{
			Severity: severityError,
			Code:     "bundle-manifest-read-failed",
			Message:  fmt.Sprintf("Unable to read mounted bundle manifest %q: %v.", manifestPath, err),
			Path:     manifestPath,
		})
		return response, nil
	}

	manifest := bundleManifest{}
	if err := yaml.Unmarshal([]byte(content), &manifest); err != nil {
		response.Diagnostics = append(response.Diagnostics, diagnostic{
			Severity: severityError,
			Code:     "bundle-manifest-invalid",
			Message:  fmt.Sprintf("Unable to parse mounted bundle manifest %q: %v.", manifestPath, err),
			Path:     manifestPath,
		})
		return response, nil
	}

	if len(manifest.Bundles) == 0 {
		response.Diagnostics = append(response.Diagnostics, diagnostic{
			Severity: severityWarning,
			Code:     "bundle-manifest-empty",
			Message:  fmt.Sprintf("Mounted bundle manifest %q does not define any bundles.", manifestPath),
			Path:     manifestPath,
		})
		return response, nil
	}

	manifestDir := filepath.Dir(manifestPath)
	seenIDs := map[string]bool{}
	for index, entry := range manifest.Bundles {
		bundle, diagnostics := manifestEntryBundle(root, manifestDir, entry, index)
		response.Diagnostics = append(response.Diagnostics, diagnostics...)
		if bundle == nil {
			continue
		}
		if seenIDs[bundle.ID] {
			response.Diagnostics = append(response.Diagnostics, diagnostic{
				Severity: severityError,
				Code:     "bundle-id-duplicate",
				Message:  fmt.Sprintf("Mounted bundle manifest %q defines duplicate bundle id %q.", manifestPath, bundle.ID),
				BundleID: bundle.ID,
				Path:     manifestPath,
			})
			continue
		}
		seenIDs[bundle.ID] = true
		response.Bundles = append(response.Bundles, *bundle)
	}

	sort.SliceStable(response.Bundles, func(left int, right int) bool {
		if response.Bundles[left].ID == response.Bundles[right].ID {
			return response.Bundles[left].Name < response.Bundles[right].Name
		}
		return response.Bundles[left].ID < response.Bundles[right].ID
	})
	sort.SliceStable(response.Diagnostics, func(left int, right int) bool {
		if response.Diagnostics[left].BundleID == response.Diagnostics[right].BundleID {
			return response.Diagnostics[left].Code < response.Diagnostics[right].Code
		}
		return response.Diagnostics[left].BundleID < response.Diagnostics[right].BundleID
	})

	return response, nil
}

func manifestEntryBundle(root string, manifestDir string, entry bundleManifestEntry, index int) (*mountedBundle, []diagnostic) {
	bundleID := strings.TrimSpace(entry.ID)
	if bundleID == "" {
		bundleID = fmt.Sprintf("manifest-entry-%d", index+1)
	}
	diagnostics := []diagnostic{}
	required := map[string]string{
		"topology":   entry.Topology,
		"stylesheet": entry.Stylesheet,
		"mapper":     entry.Mapper,
	}
	paths := map[string]string{}
	for kind, value := range required {
		resolved, err := resolveManifestEntryPath(root, manifestDir, value)
		if strings.TrimSpace(value) == "" {
			diagnostics = append(diagnostics, diagnostic{
				Severity: severityError,
				Code:     "bundle-manifest-field-missing",
				Message:  fmt.Sprintf("Mounted bundle %q must define %s path in the manifest.", bundleID, kind),
				BundleID: bundleID,
				Path:     manifestDir,
			})
			continue
		}
		if err != nil {
			diagnostics = append(diagnostics, diagnostic{
				Severity: severityError,
				Code:     "bundle-manifest-path-invalid",
				Message:  fmt.Sprintf("Mounted bundle %q %s path is invalid: %v.", bundleID, kind, err),
				BundleID: bundleID,
				Path:     value,
			})
			continue
		}
		paths[kind] = resolved
		if _, err := os.Stat(resolved); err != nil {
			diagnostics = append(diagnostics, diagnostic{
				Severity: severityError,
				Code:     "bundle-manifest-file-missing",
				Message:  fmt.Sprintf("Mounted bundle %q %s file does not exist: %s.", bundleID, kind, resolved),
				BundleID: bundleID,
				Path:     resolved,
			})
		}
	}
	if len(diagnostics) > 0 {
		return nil, diagnostics
	}
	name := strings.TrimSpace(entry.Name)
	if name == "" {
		name = titleFromBundleID(bundleID)
	}
	return &mountedBundle{
		ID:             bundleID,
		Name:           name,
		Root:           commonBundleRoot(paths["topology"], paths["stylesheet"], paths["mapper"]),
		TopologyPath:   paths["topology"],
		StylesheetPath: paths["stylesheet"],
		MapperPath:     paths["mapper"],
	}, diagnostics
}

func resolveManifestEntryPath(root string, manifestDir string, pathValue string) (string, error) {
	value := strings.TrimSpace(pathValue)
	if value == "" {
		return "", nil
	}
	var resolved string
	if filepath.IsAbs(value) {
		resolved = filepath.Clean(value)
	} else {
		rootRelative := filepath.Join(root, value)
		manifestRelative := filepath.Join(manifestDir, value)
		if _, err := os.Stat(rootRelative); err == nil {
			resolved = rootRelative
		} else {
			resolved = manifestRelative
		}
	}
	absolute, err := filepath.Abs(resolved)
	if err != nil {
		return "", err
	}
	if !pathWithinRoot(root, absolute) {
		return "", fmt.Errorf("path %q must be under bundle root %q", absolute, root)
	}
	return absolute, nil
}

func commonBundleRoot(paths ...string) string {
	if len(paths) == 0 {
		return ""
	}
	root := filepath.Dir(paths[0])
	for _, path := range paths[1:] {
		dir := filepath.Dir(path)
		for !pathWithinRoot(root, dir) {
			next := filepath.Dir(root)
			if next == root {
				return filepath.Dir(paths[0])
			}
			root = next
		}
	}
	return root
}

func discoverBundle(bundleRoot string, bundleID string) (*mountedBundle, []diagnostic, error) {
	matchesByKind := map[string][]string{
		"topology":   {},
		"stylesheet": {},
		"mapper":     {},
	}
	err := filepath.WalkDir(bundleRoot, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if path != bundleRoot && entry.IsDir() {
			return filepath.SkipDir
		}
		if entry.IsDir() {
			return nil
		}
		name := entry.Name()
		switch {
		case strings.HasSuffix(name, ".topo.tv.yaml"):
			matchesByKind["topology"] = append(matchesByKind["topology"], path)
		case strings.HasSuffix(name, ".style.tv.yaml"):
			matchesByKind["stylesheet"] = append(matchesByKind["stylesheet"], path)
		case strings.HasSuffix(name, ".mapper.tv.yaml"):
			matchesByKind["mapper"] = append(matchesByKind["mapper"], path)
		}
		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	diagnostics := []diagnostic{}
	for kind, matches := range matchesByKind {
		sort.Strings(matches)
		if len(matches) == 0 {
			diagnostics = append(diagnostics, diagnostic{
				Severity: severityWarning,
				Code:     "bundle-file-missing",
				Message:  fmt.Sprintf("Bundle %q does not contain a *.%s.tv.yaml file.", bundleID, suffixForKind(kind)),
				BundleID: bundleID,
				Path:     bundleRoot,
			})
		}
		if len(matches) > 1 {
			diagnostics = append(diagnostics, diagnostic{
				Severity: severityError,
				Code:     "bundle-file-duplicate",
				Message:  fmt.Sprintf("Bundle %q contains multiple %s files; keep exactly one.", bundleID, kind),
				BundleID: bundleID,
				Path:     bundleRoot,
			})
		}
	}
	if len(matchesByKind["topology"]) != 1 || len(matchesByKind["stylesheet"]) != 1 || len(matchesByKind["mapper"]) != 1 {
		return nil, diagnostics, nil
	}

	return &mountedBundle{
		ID:             bundleID,
		Name:           titleFromBundleID(bundleID),
		Root:           bundleRoot,
		TopologyPath:   matchesByKind["topology"][0],
		StylesheetPath: matchesByKind["stylesheet"][0],
		MapperPath:     matchesByKind["mapper"][0],
	}, diagnostics, nil
}

func suffixForKind(kind string) string {
	switch kind {
	case "topology":
		return "topo"
	case "stylesheet":
		return "style"
	case "mapper":
		return "mapper"
	default:
		return kind
	}
}

func titleFromBundleID(bundleID string) string {
	words := strings.FieldsFunc(bundleID, func(r rune) bool {
		return r == '-' || r == '_' || r == '.'
	})
	for index, word := range words {
		if word == "" {
			continue
		}
		words[index] = strings.ToUpper(word[:1]) + word[1:]
	}
	return strings.Join(words, " ")
}

func readBundle(root string, manifestPath string, bundleID string) (bundleResponse, error) {
	index, err := discoverBundles(root, manifestPath)
	if err != nil {
		return bundleResponse{}, err
	}
	for _, bundle := range index.Bundles {
		if bundle.ID != bundleID {
			continue
		}
		topologyYAML, err := readLimitedTextFile(bundle.TopologyPath)
		if err != nil {
			return bundleResponse{}, err
		}
		stylesheetYAML, err := readLimitedTextFile(bundle.StylesheetPath)
		if err != nil {
			return bundleResponse{}, err
		}
		mapperYAML, err := readLimitedTextFile(bundle.MapperPath)
		if err != nil {
			return bundleResponse{}, err
		}
		return bundleResponse{
			Bundle:         bundle,
			TopologyYAML:   topologyYAML,
			StylesheetYAML: stylesheetYAML,
			MapperYAML:     mapperYAML,
			Diagnostics:    diagnosticsForBundle(index.Diagnostics, bundle.ID),
		}, nil
	}
	return bundleResponse{}, fmt.Errorf("%w: mounted TopoViewer bundle %q was not found under %q", os.ErrNotExist, bundleID, root)
}

func readLimitedTextFile(path string) (string, error) {
	info, err := os.Stat(path)
	if err != nil {
		return "", err
	}
	if info.Size() > maxBundleFileSize {
		return "", fmt.Errorf("bundle file %q is too large (%d bytes); limit is %d bytes", path, info.Size(), maxBundleFileSize)
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func diagnosticsForBundle(diagnostics []diagnostic, bundleID string) []diagnostic {
	result := []diagnostic{}
	for _, diagnostic := range diagnostics {
		if diagnostic.BundleID == bundleID {
			result = append(result, diagnostic)
		}
	}
	return result
}
