package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/asadarafat/topoviewer/apps/topoviewer-studio-desktop/internal/native"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const projectChangeEvent = "topoviewer:desktop-project-change"

type ProjectResponse struct {
	Error   *native.ServiceError     `json:"error,omitempty"`
	Project *native.ProjectReference `json:"project,omitempty"`
}

type FilesResponse struct {
	Error *native.ServiceError `json:"error,omitempty"`
	Files []native.FileEntry   `json:"files,omitempty"`
}

type BytesResponse struct {
	BytesBase64 string               `json:"bytesBase64,omitempty"`
	Error       *native.ServiceError `json:"error,omitempty"`
}

type RevisionResponse struct {
	Error    *native.ServiceError `json:"error,omitempty"`
	Revision string               `json:"revision,omitempty"`
}

type EmptyResponse struct {
	Error *native.ServiceError `json:"error,omitempty"`
}

type ValueResponse struct {
	Error     *native.ServiceError `json:"error,omitempty"`
	Found     bool                 `json:"found"`
	ValueJSON string               `json:"valueJSON,omitempty"`
}

type NativeAsset struct {
	BytesBase64 string `json:"bytesBase64"`
	MediaType   string `json:"mediaType"`
	Name        string `json:"name"`
}

type AssetsResponse struct {
	Assets []NativeAsset        `json:"assets,omitempty"`
	Error  *native.ServiceError `json:"error,omitempty"`
}

type AssetRequest struct {
	Accept       []string `json:"accept"`
	MaximumBytes int      `json:"maximumBytes"`
	Multiple     bool     `json:"multiple"`
}

type CommitFileRequest struct {
	BytesBase64 string `json:"bytesBase64"`
	Path        string `json:"path"`
}

type CommitFilesRequest struct {
	ExpectedRevision string              `json:"expectedRevision"`
	Files            []CommitFileRequest `json:"files"`
	Token            string              `json:"token"`
}

type ArtifactContentRequest struct {
	BytesBase64 string `json:"bytesBase64"`
	MediaType   string `json:"mediaType"`
	Name        string `json:"name"`
}

type ArtifactRequest struct {
	Artifact      ArtifactContentRequest `json:"artifact"`
	Kind          string                 `json:"kind"`
	SuggestedName string                 `json:"suggestedName"`
}

type projectWatcher struct {
	cancel context.CancelFunc
}

type DesktopApp struct {
	ctx      context.Context
	service  *native.ProjectService
	watchers map[string]projectWatcher
	watchMu  sync.Mutex
}

func NewDesktopApp() (*DesktopApp, error) {
	configDirectory, err := os.UserConfigDir()
	if err != nil {
		return nil, native.NewServiceError(native.ErrorUnavailable, "Studio cannot locate private application storage.", true, nil)
	}
	service, err := native.NewProjectService(native.ProjectServiceConfig{
		StateDirectory: filepath.Join(configDirectory, "TopoViewer Studio"),
	})
	if err != nil {
		return nil, err
	}
	return &DesktopApp{
		service:  service,
		watchers: make(map[string]projectWatcher),
	}, nil
}

func (a *DesktopApp) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *DesktopApp) shutdown(_ context.Context) {
	a.watchMu.Lock()
	for _, watcher := range a.watchers {
		watcher.cancel()
	}
	a.watchers = make(map[string]projectWatcher)
	a.watchMu.Unlock()
}

func (a *DesktopApp) StartupProject() ProjectResponse {
	recent, err := a.service.ReopenRecent()
	if err != nil {
		return ProjectResponse{Error: serviceError(err)}
	}
	if recent != nil {
		return ProjectResponse{Project: recent}
	}
	project, err := a.service.ReserveProject("Untitled topology")
	if err != nil {
		return ProjectResponse{Error: serviceError(err)}
	}
	return ProjectResponse{Project: &project}
}

func (a *DesktopApp) NewUntitledProject() ProjectResponse {
	project, err := a.service.ReserveProject("Untitled topology")
	if err != nil {
		return ProjectResponse{Error: serviceError(err)}
	}
	return ProjectResponse{Project: &project}
}

func (a *DesktopApp) OpenProjectFolder() ProjectResponse {
	if a.ctx == nil {
		return ProjectResponse{Error: native.NewServiceError(native.ErrorUnavailable, "The desktop window is not ready.", true, nil)}
	}
	root, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		CanCreateDirectories: true,
		ResolvesAliases:      false,
		Title:                "Open TopoViewer project",
	})
	if err != nil {
		return ProjectResponse{Error: native.NewServiceError(native.ErrorUnavailable, "Studio could not open the folder picker.", true, nil)}
	}
	if root == "" {
		return ProjectResponse{Error: native.NewServiceError(native.ErrorCancelled, "Folder selection was cancelled.", true, nil)}
	}
	project, err := a.service.ApproveRoot(root)
	if err != nil {
		return ProjectResponse{Error: serviceError(err)}
	}
	return ProjectResponse{Project: &project}
}

func (a *DesktopApp) PromoteRecentProject(token string) EmptyResponse {
	if err := a.service.PromoteRecent(token); err != nil {
		return EmptyResponse{Error: serviceError(err)}
	}
	return EmptyResponse{}
}

func (a *DesktopApp) ForgetRecentProject(token string) EmptyResponse {
	if err := a.service.ForgetRecent(token); err != nil {
		return EmptyResponse{Error: serviceError(err)}
	}
	return EmptyResponse{}
}

func (a *DesktopApp) ReleaseProject(token string) EmptyResponse {
	_ = a.UnwatchProject(token)
	if err := a.service.ReleaseProject(token); err != nil {
		return EmptyResponse{Error: serviceError(err)}
	}
	return EmptyResponse{}
}

func (a *DesktopApp) SaveUntitledProject(request CommitFilesRequest) ProjectResponse {
	if a.ctx == nil {
		return ProjectResponse{Error: native.NewServiceError(native.ErrorUnavailable, "The desktop window is not ready.", true, nil)}
	}
	root, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		CanCreateDirectories: true,
		ResolvesAliases:      false,
		Title:                "Save TopoViewer project",
	})
	if err != nil {
		return ProjectResponse{Error: native.NewServiceError(native.ErrorUnavailable, "Studio could not open the folder picker.", true, nil)}
	}
	if root == "" {
		return ProjectResponse{Error: native.NewServiceError(native.ErrorCancelled, "Folder selection was cancelled.", true, nil)}
	}
	writes, err := decodeCommitWrites(request.Files)
	if err != nil {
		return ProjectResponse{Error: serviceError(err)}
	}
	project, err := a.service.SaveUntitledProject(native.FirstSaveRequest{
		ExpectedRevision: request.ExpectedRevision,
		Files:            writes,
		Root:             root,
		Token:            request.Token,
	})
	if err != nil {
		return ProjectResponse{Error: serviceError(err)}
	}
	return ProjectResponse{Project: &project}
}

func (a *DesktopApp) ListFiles(token string) FilesResponse {
	files, err := a.service.ListFiles(token)
	if err != nil {
		return FilesResponse{Error: serviceError(err)}
	}
	return FilesResponse{Files: files}
}

func (a *DesktopApp) ReadFile(token, path string) BytesResponse {
	value, err := a.service.ReadFile(token, path)
	if err != nil {
		return BytesResponse{Error: serviceError(err)}
	}
	return BytesResponse{BytesBase64: base64.StdEncoding.EncodeToString(value)}
}

func (a *DesktopApp) Revision(token string) RevisionResponse {
	revision, err := a.service.Revision(token)
	if err != nil {
		return RevisionResponse{Error: serviceError(err)}
	}
	return RevisionResponse{Revision: revision}
}

func (a *DesktopApp) CommitFiles(request CommitFilesRequest) RevisionResponse {
	writes, err := decodeCommitWrites(request.Files)
	if err != nil {
		return RevisionResponse{Error: serviceError(err)}
	}
	result, err := a.service.CommitFiles(native.CommitRequest{
		ExpectedRevision: request.ExpectedRevision,
		Files:            writes,
		Token:            request.Token,
	})
	if err != nil {
		return RevisionResponse{Error: serviceError(err)}
	}
	return RevisionResponse{Revision: result.Revision}
}

func decodeCommitWrites(files []CommitFileRequest) ([]native.CommitWrite, error) {
	limits := native.DefaultLimits()
	if len(files) == 0 {
		return nil, native.NewServiceError(native.ErrorInvalidRequest, "At least one project file is required.", false, nil)
	}
	if len(files) > limits.MaxFiles {
		return nil, native.NewServiceError(native.ErrorQuotaExceeded, "The project write exceeds the supported file-count limit.", false, nil)
	}
	writes := make([]native.CommitWrite, 0, len(files))
	var total int64
	for _, file := range files {
		if len(file.BytesBase64) > base64.StdEncoding.EncodedLen(int(limits.MaxFileBytes)) {
			return nil, native.NewServiceError(native.ErrorQuotaExceeded, "A project write exceeds the per-file size limit.", false, nil)
		}
		bytes, err := base64.StdEncoding.Strict().DecodeString(file.BytesBase64)
		if err != nil {
			return nil, native.NewServiceError(native.ErrorCorruptData, "A project write contains invalid base64 content.", false, nil)
		}
		total += int64(len(bytes))
		if int64(len(bytes)) > limits.MaxFileBytes || total > limits.MaxProjectBytes {
			return nil, native.NewServiceError(native.ErrorQuotaExceeded, "The project write exceeds the supported size limit.", false, nil)
		}
		writes = append(writes, native.CommitWrite{Bytes: bytes, Path: file.Path})
	}
	return writes, nil
}

func (a *DesktopApp) ReadPreference(key string) ValueResponse {
	value, err := a.service.ReadPreference(key)
	if err != nil {
		return ValueResponse{Error: serviceError(err)}
	}
	if len(value) == 0 {
		return ValueResponse{Found: false}
	}
	return ValueResponse{Found: true, ValueJSON: string(value)}
}

func (a *DesktopApp) WritePreference(key, valueJSON string) EmptyResponse {
	if err := a.service.WritePreference(key, json.RawMessage(valueJSON)); err != nil {
		return EmptyResponse{Error: serviceError(err)}
	}
	return EmptyResponse{}
}

func (a *DesktopApp) ReadRecovery(token string) ValueResponse {
	value, err := a.service.ReadRecovery(token)
	if err != nil {
		return ValueResponse{Error: serviceError(err)}
	}
	if len(value) == 0 {
		return ValueResponse{Found: false}
	}
	return ValueResponse{Found: true, ValueJSON: string(value)}
}

func (a *DesktopApp) WriteRecovery(token, valueJSON string) EmptyResponse {
	if err := a.service.WriteRecovery(token, []byte(valueJSON)); err != nil {
		return EmptyResponse{Error: serviceError(err)}
	}
	return EmptyResponse{}
}

func (a *DesktopApp) ChooseAssets(request AssetRequest) AssetsResponse {
	if a.ctx == nil {
		return AssetsResponse{Error: native.NewServiceError(native.ErrorUnavailable, "The desktop window is not ready.", true, nil)}
	}
	if request.MaximumBytes <= 0 {
		return AssetsResponse{Error: native.NewServiceError(native.ErrorInvalidRequest, "A positive asset size limit is required.", false, nil)}
	}
	if int64(request.MaximumBytes) > native.DefaultLimits().MaxFileBytes {
		return AssetsResponse{Error: native.NewServiceError(native.ErrorQuotaExceeded, "The requested asset limit exceeds the desktop per-file limit.", false, nil)}
	}
	options := runtime.OpenDialogOptions{
		Filters: []runtime.FileFilter{{
			DisplayName: "Supported assets",
			Pattern:     assetPattern(request.Accept),
		}},
		ResolvesAliases: false,
		Title:           "Choose TopoViewer assets",
	}
	var paths []string
	var err error
	if request.Multiple {
		paths, err = runtime.OpenMultipleFilesDialog(a.ctx, options)
	} else {
		var path string
		path, err = runtime.OpenFileDialog(a.ctx, options)
		if path != "" {
			paths = []string{path}
		}
	}
	if err != nil {
		return AssetsResponse{Error: native.NewServiceError(native.ErrorUnavailable, "Studio could not open the asset picker.", true, nil)}
	}
	if len(paths) == 0 {
		return AssetsResponse{Error: native.NewServiceError(native.ErrorCancelled, "Asset selection was cancelled.", true, nil)}
	}
	assets, err := readSelectedAssets(paths, request.MaximumBytes, native.DefaultLimits())
	if err != nil {
		return AssetsResponse{Error: serviceError(err)}
	}
	return AssetsResponse{Assets: assets}
}

func readSelectedAssets(paths []string, maximumBytes int, limits native.Limits) ([]NativeAsset, error) {
	if maximumBytes <= 0 {
		return nil, native.NewServiceError(native.ErrorInvalidRequest, "A positive asset size limit is required.", false, nil)
	}
	if int64(maximumBytes) > limits.MaxFileBytes {
		return nil, native.NewServiceError(native.ErrorQuotaExceeded, "The requested asset limit exceeds the desktop per-file limit.", false, nil)
	}
	if len(paths) > limits.MaxFiles {
		return nil, native.NewServiceError(native.ErrorQuotaExceeded, "The asset selection exceeds the desktop file-count limit.", false, nil)
	}
	assets := make([]NativeAsset, 0, len(paths))
	var total int64
	for _, path := range paths {
		info, err := os.Lstat(path)
		if err != nil || info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
			return nil, native.NewServiceError(native.ErrorPermissionDenied, "A selected asset is not a regular file.", false, nil)
		}
		if info.Size() > int64(maximumBytes) || info.Size() > limits.MaxFileBytes || total+info.Size() > limits.MaxProjectBytes {
			return nil, native.NewServiceError(native.ErrorQuotaExceeded, "The selected assets exceed the desktop size limit.", false, nil)
		}
		file, err := os.Open(path)
		if err != nil {
			return nil, native.NewServiceError(native.ErrorPermissionDenied, "Studio cannot read a selected asset.", true, nil)
		}
		openedInfo, statErr := file.Stat()
		if statErr != nil || !openedInfo.Mode().IsRegular() || !os.SameFile(info, openedInfo) {
			_ = file.Close()
			return nil, native.NewServiceError(native.ErrorPermissionDenied, "A selected asset changed before Studio could read it.", true, nil)
		}
		remaining := limits.MaxProjectBytes - total
		allowed := min(int64(maximumBytes), limits.MaxFileBytes, remaining)
		bytes, readErr := io.ReadAll(io.LimitReader(file, allowed+1))
		closeErr := file.Close()
		if readErr != nil || closeErr != nil {
			return nil, native.NewServiceError(native.ErrorPermissionDenied, "Studio cannot read a selected asset.", true, nil)
		}
		if int64(len(bytes)) > allowed {
			return nil, native.NewServiceError(native.ErrorQuotaExceeded, "The selected assets exceed the desktop size limit.", false, nil)
		}
		total += int64(len(bytes))
		assets = append(assets, NativeAsset{
			BytesBase64: base64.StdEncoding.EncodeToString(bytes),
			MediaType:   mediaTypeForAsset(path),
			Name:        filepath.Base(path),
		})
	}
	return assets, nil
}

func (a *DesktopApp) CopyText(text string) EmptyResponse {
	if a.ctx == nil {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorUnavailable, "The desktop window is not ready.", true, nil)}
	}
	if err := runtime.ClipboardSetText(a.ctx, text); err != nil {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorUnavailable, "Studio could not access the clipboard.", true, nil)}
	}
	return EmptyResponse{}
}

func (a *DesktopApp) ExportArtifact(request ArtifactRequest) EmptyResponse {
	if a.ctx == nil {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorUnavailable, "The desktop window is not ready.", true, nil)}
	}
	if request.SuggestedName == "" || filepath.Base(request.SuggestedName) != request.SuggestedName {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorInvalidRequest, "The export name must be a plain filename.", false, nil)}
	}
	const maximumExportBytes = 25 * 1024 * 1024
	if len(request.Artifact.BytesBase64) > base64.StdEncoding.EncodedLen(maximumExportBytes) {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorQuotaExceeded, "The export exceeds the 25 MiB desktop limit.", false, nil)}
	}
	bytes, err := base64.StdEncoding.Strict().DecodeString(request.Artifact.BytesBase64)
	if err != nil {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorCorruptData, "The export contains invalid base64 content.", false, nil)}
	}
	if len(bytes) > maximumExportBytes {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorQuotaExceeded, "The export exceeds the 25 MiB desktop limit.", false, nil)}
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		CanCreateDirectories: true,
		DefaultFilename:      request.SuggestedName,
		Title:                "Export TopoViewer artifact",
	})
	if err != nil {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorUnavailable, "Studio could not open the export dialog.", true, nil)}
	}
	if path == "" {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorCancelled, "Export was cancelled.", true, nil)}
	}
	if err := writeExport(path, bytes); err != nil {
		return EmptyResponse{Error: native.NewServiceError(native.ErrorPermissionDenied, "Studio could not write the selected export file.", true, nil)}
	}
	return EmptyResponse{}
}

func (a *DesktopApp) WatchProject(token string) EmptyResponse {
	if _, err := a.service.Revision(token); err != nil {
		return EmptyResponse{Error: serviceError(err)}
	}
	a.watchMu.Lock()
	if _, exists := a.watchers[token]; exists {
		a.watchMu.Unlock()
		return EmptyResponse{}
	}
	ctx, cancel := context.WithCancel(context.Background())
	a.watchers[token] = projectWatcher{cancel: cancel}
	a.watchMu.Unlock()

	go a.pollProject(ctx, token)
	return EmptyResponse{}
}

func (a *DesktopApp) UnwatchProject(token string) EmptyResponse {
	a.watchMu.Lock()
	watcher, exists := a.watchers[token]
	if exists {
		delete(a.watchers, token)
	}
	a.watchMu.Unlock()
	if exists {
		watcher.cancel()
	}
	return EmptyResponse{}
}

func (a *DesktopApp) pollProject(ctx context.Context, token string) {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			change, err := a.service.DetectExternalChange(token)
			if err != nil || change == nil || a.ctx == nil {
				continue
			}
			runtime.EventsEmit(a.ctx, projectChangeEvent, map[string]any{
				"paths":    change.Paths,
				"revision": change.Revision,
				"token":    token,
			})
		}
	}
}

func serviceError(err error) *native.ServiceError {
	var typed *native.ServiceError
	if errors.As(err, &typed) {
		return typed
	}
	return native.NewServiceError(native.ErrorUnknown, "The desktop host operation failed.", true, nil)
}

func assetPattern(accepted []string) string {
	extensions := make([]string, 0, len(accepted))
	known := map[string]string{
		"application/json": "*.json",
		"application/yaml": "*.yaml;*.yml",
		"image/gif":        "*.gif",
		"image/jpeg":       "*.jpg;*.jpeg",
		"image/png":        "*.png",
		"image/svg+xml":    "*.svg",
		"image/webp":       "*.webp",
	}
	for _, value := range accepted {
		if extension := known[value]; extension != "" {
			extensions = append(extensions, extension)
		} else if strings.HasPrefix(value, ".") && !strings.ContainsAny(value, `/\;*?`) {
			extensions = append(extensions, "*"+value)
		}
	}
	if len(extensions) == 0 {
		return "*"
	}
	return strings.Join(extensions, ";")
}

func mediaTypeForAsset(path string) string {
	if value := mime.TypeByExtension(strings.ToLower(filepath.Ext(path))); value != "" {
		return strings.Split(value, ";")[0]
	}
	return "application/octet-stream"
}

func writeExport(path string, bytes []byte) error {
	directory := filepath.Dir(path)
	staged, err := os.CreateTemp(directory, ".topoviewer-export-*")
	if err != nil {
		return err
	}
	stageName := staged.Name()
	defer os.Remove(stageName)
	if err := staged.Chmod(0o600); err == nil {
		_, err = staged.Write(bytes)
	}
	if err == nil {
		err = staged.Sync()
	}
	closeErr := staged.Close()
	if err == nil {
		err = closeErr
	}
	if err != nil {
		return err
	}
	return os.Rename(stageName, path)
}
