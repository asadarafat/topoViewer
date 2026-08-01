package native

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"mime"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

const (
	defaultMaxFileBytes       = int64(10 * 1024 * 1024)
	defaultMaxFiles           = 256
	defaultMaxPreferenceBytes = 256 * 1024
	defaultMaxProjectBytes    = int64(25 * 1024 * 1024)
	defaultMaxRecoveryBytes   = 10 * 1024 * 1024
)

var preferenceKeyPattern = regexp.MustCompile(`^[a-zA-Z0-9._-]{1,128}$`)

type Limits struct {
	MaxFileBytes       int64
	MaxFiles           int
	MaxPreferenceBytes int
	MaxProjectBytes    int64
	MaxRecoveryBytes   int
}

type ProjectServiceConfig struct {
	Limits         Limits
	Rename         func(string, string) error
	StateDirectory string
	Token          func() (string, error)
}

type ProjectReference struct {
	Name     string `json:"name"`
	Revision string `json:"revision,omitempty"`
	Token    string `json:"token"`
}

type FileEntry struct {
	MediaType  string `json:"mediaType,omitempty"`
	ModifiedAt string `json:"modifiedAt,omitempty"`
	Path       string `json:"path"`
	Size       int64  `json:"size"`
}

type CommitWrite struct {
	Bytes []byte `json:"-"`
	Path  string `json:"path"`
}

type CommitRequest struct {
	ExpectedRevision string        `json:"expectedRevision"`
	Files            []CommitWrite `json:"files"`
	Token            string        `json:"token"`
}

type FirstSaveRequest struct {
	ExpectedRevision string
	Files            []CommitWrite
	Root             string
	Token            string
}

type CommitResult struct {
	Revision string `json:"revision"`
}

type ProjectChange struct {
	Kind     string   `json:"kind"`
	Paths    []string `json:"paths"`
	Revision string   `json:"revision"`
}

type ProjectService struct {
	ioMu         sync.RWMutex
	limits       Limits
	mu           sync.RWMutex
	names        map[string]string
	observed     map[string]string
	rename       func(string, string) error
	roots        map[string]string
	stateDir     string
	tokenFactory func() (string, error)
}

type stagedWrite struct {
	backup    string
	existed   bool
	installed bool
	mode      fs.FileMode
	path      string
	stage     string
}

func NewProjectService(config ProjectServiceConfig) (*ProjectService, error) {
	if strings.TrimSpace(config.StateDirectory) == "" {
		return nil, NewServiceError(ErrorInvalidRequest, "A private application state directory is required.", false, nil)
	}
	stateDirectory, err := filepath.Abs(config.StateDirectory)
	if err != nil {
		return nil, NewServiceError(ErrorInvalidRequest, "The application state directory is invalid.", false, nil)
	}
	if err := os.MkdirAll(stateDirectory, 0o700); err != nil {
		return nil, NewServiceError(ErrorPermissionDenied, "Studio could not create its private state directory.", true, nil)
	}
	if err := os.Chmod(stateDirectory, 0o700); err != nil {
		return nil, NewServiceError(ErrorPermissionDenied, "Studio could not secure its private state directory.", true, nil)
	}

	return &ProjectService{
		limits:       normalizeLimits(config.Limits),
		names:        make(map[string]string),
		observed:     make(map[string]string),
		rename:       firstRename(config.Rename),
		roots:        make(map[string]string),
		stateDir:     stateDirectory,
		tokenFactory: firstTokenFactory(config.Token),
	}, nil
}

func normalizeLimits(input Limits) Limits {
	if input.MaxFileBytes <= 0 {
		input.MaxFileBytes = defaultMaxFileBytes
	}
	if input.MaxFiles <= 0 {
		input.MaxFiles = defaultMaxFiles
	}
	if input.MaxPreferenceBytes <= 0 {
		input.MaxPreferenceBytes = defaultMaxPreferenceBytes
	}
	if input.MaxProjectBytes <= 0 {
		input.MaxProjectBytes = defaultMaxProjectBytes
	}
	if input.MaxRecoveryBytes <= 0 {
		input.MaxRecoveryBytes = defaultMaxRecoveryBytes
	}
	return input
}

func DefaultLimits() Limits {
	return normalizeLimits(Limits{})
}

func firstRename(candidate func(string, string) error) func(string, string) error {
	if candidate != nil {
		return candidate
	}
	return os.Rename
}

func firstTokenFactory(candidate func() (string, error)) func() (string, error) {
	if candidate != nil {
		return candidate
	}
	return func() (string, error) {
		value := make([]byte, 24)
		if _, err := rand.Read(value); err != nil {
			return "", err
		}
		return hex.EncodeToString(value), nil
	}
}

func (s *ProjectService) ApproveRoot(candidate string) (ProjectReference, error) {
	canonical, err := canonicalDirectory(candidate)
	if err != nil {
		return ProjectReference{}, err
	}
	s.ioMu.RLock()
	revision, err := s.revisionForRoot(canonical)
	s.ioMu.RUnlock()
	if err != nil {
		return ProjectReference{}, err
	}
	token, err := s.tokenFactory()
	if err != nil || strings.TrimSpace(token) == "" {
		return ProjectReference{}, NewServiceError(ErrorUnavailable, "Studio could not create a project authority token.", true, nil)
	}

	s.mu.Lock()
	if _, exists := s.roots[token]; exists {
		s.mu.Unlock()
		return ProjectReference{}, NewServiceError(ErrorUnavailable, "Studio generated a duplicate project authority token.", true, nil)
	}
	s.roots[token] = canonical
	s.names[token] = filepath.Base(canonical)
	s.observed[token] = revision
	s.mu.Unlock()

	return ProjectReference{
		Name:     filepath.Base(canonical),
		Revision: revision,
		Token:    token,
	}, nil
}

func (s *ProjectService) PromoteRecent(token string) error {
	root, err := s.approvedRoot(token)
	if err != nil {
		return err
	}
	return s.rememberRecent(root)
}

func (s *ProjectService) ForgetRecent(token string) error {
	root, err := s.approvedRoot(token)
	if err != nil {
		return err
	}
	value, err := s.readPrivateFile("lifecycle", "recent-project.json", s.limits.MaxPreferenceBytes)
	if err != nil || len(value) == 0 {
		return err
	}
	var recent struct {
		Root string `json:"root"`
	}
	if err := json.Unmarshal(value, &recent); err != nil {
		return NewServiceError(ErrorCorruptData, "The recent project record is invalid.", false, nil)
	}
	if recent.Root != root {
		return nil
	}
	return s.clearRecent()
}

func (s *ProjectService) ReleaseProject(token string) error {
	if strings.TrimSpace(token) == "" {
		return NewServiceError(ErrorInvalidRequest, "A project authority token is required.", false, nil)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	root, exists := s.roots[token]
	if !exists {
		return nil
	}
	delete(s.roots, token)
	delete(s.names, token)
	delete(s.observed, token)
	if root == "" {
		_ = os.Remove(filepath.Join(s.stateDir, "recovery", privateName("untitled:"+token)))
	}
	return nil
}

func (s *ProjectService) ReserveProject(name string) (ProjectReference, error) {
	token, err := s.tokenFactory()
	if err != nil || strings.TrimSpace(token) == "" {
		return ProjectReference{}, NewServiceError(ErrorUnavailable, "Studio could not create a project authority token.", true, nil)
	}
	displayName := strings.TrimSpace(name)
	if displayName == "" {
		displayName = "Untitled topology"
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.roots[token]; exists {
		return ProjectReference{}, NewServiceError(ErrorUnavailable, "Studio generated a duplicate project authority token.", true, nil)
	}
	s.roots[token] = ""
	s.names[token] = displayName
	s.observed[token] = "untitled"
	return ProjectReference{Name: displayName, Revision: "untitled", Token: token}, nil
}

func (s *ProjectService) SaveUntitledProject(request FirstSaveRequest) (ProjectReference, error) {
	if len(request.Files) == 0 {
		return ProjectReference{}, NewServiceError(ErrorInvalidRequest, "At least one project file is required.", false, nil)
	}
	if request.ExpectedRevision != "untitled" {
		return ProjectReference{}, NewServiceError(
			ErrorConflict,
			"The untitled project changed before first save.",
			true,
			map[string]any{
				"actualRevision":   "untitled",
				"expectedRevision": request.ExpectedRevision,
			},
		)
	}
	canonical, err := canonicalDirectory(request.Root)
	if err != nil {
		return ProjectReference{}, err
	}
	s.ioMu.Lock()
	defer s.ioMu.Unlock()
	s.mu.Lock()
	defer s.mu.Unlock()
	current, exists := s.roots[request.Token]
	if !exists {
		return ProjectReference{}, NewServiceError(ErrorNotFound, "The project authority token is not active.", true, nil)
	}
	if current != "" {
		return ProjectReference{}, NewServiceError(ErrorConflict, "The project authority token is already bound to a directory.", false, nil)
	}
	if s.observed[request.Token] != request.ExpectedRevision {
		return ProjectReference{}, NewServiceError(ErrorConflict, "The untitled project changed before first save.", true, nil)
	}
	entries, err := s.listFilesAtRoot(canonical)
	if err != nil {
		return ProjectReference{}, err
	}
	if len(entries) > 0 {
		return ProjectReference{}, NewServiceError(
			ErrorConflict,
			"First save requires an empty directory; open an existing TopoViewer directory instead.",
			false,
			nil,
		)
	}
	if err := s.validateProjectedLimits(canonical, request.Files); err != nil {
		return ProjectReference{}, err
	}
	untitledRecoveryName := privateName("untitled:" + request.Token)
	recovery, err := s.readPrivateFile("recovery", untitledRecoveryName, s.limits.MaxRecoveryBytes)
	if err != nil {
		return ProjectReference{}, err
	}
	directoryRecoveryName := privateName("directory:" + canonical)
	previousDirectoryRecovery, err := s.readPrivateFile("recovery", directoryRecoveryName, s.limits.MaxRecoveryBytes)
	if err != nil {
		return ProjectReference{}, err
	}

	staged, err := s.stageWrites(canonical, request.Files)
	if err != nil {
		return ProjectReference{}, err
	}
	if err := s.installWrites(staged); err != nil {
		rollbackError := s.rollbackWrites(staged)
		recoveryBackupRetained := s.cleanupAfterRollback(staged, rollbackError)
		return ProjectReference{}, NewServiceError(
			ErrorPartialFailure,
			"Studio could not create every project file; created files were removed where possible."+rollbackRecoveryMessage(recoveryBackupRetained),
			true,
			rollbackFailureDetails(rollbackError, recoveryBackupRetained),
		)
	}
	rollbackInstalled := func(cause error) error {
		rollbackError := s.rollbackWrites(staged)
		recoveryBackupRetained := s.cleanupAfterRollback(staged, rollbackError)
		if rollbackError == nil {
			return cause
		}
		return NewServiceError(
			ErrorPartialFailure,
			"Studio could not complete first save or remove every created file."+rollbackRecoveryMessage(recoveryBackupRetained),
			true,
			rollbackFailureDetails(rollbackError, recoveryBackupRetained),
		)
	}

	revision, err := s.revisionForRoot(canonical)
	if err != nil {
		return ProjectReference{}, rollbackInstalled(err)
	}
	if len(recovery) > 0 {
		if err := s.writePrivateFile("recovery", directoryRecoveryName, recovery); err != nil {
			return ProjectReference{}, rollbackInstalled(err)
		}
	}
	if err := s.rememberRecent(canonical); err != nil {
		if len(recovery) > 0 {
			if len(previousDirectoryRecovery) > 0 {
				_ = s.writePrivateFile("recovery", directoryRecoveryName, previousDirectoryRecovery)
			} else {
				_ = os.Remove(filepath.Join(s.stateDir, "recovery", directoryRecoveryName))
			}
		}
		return ProjectReference{}, rollbackInstalled(err)
	}
	s.cleanupWrites(staged)
	s.roots[request.Token] = canonical
	s.names[request.Token] = filepath.Base(canonical)
	s.observed[request.Token] = revision
	if len(recovery) > 0 {
		_ = os.Remove(filepath.Join(s.stateDir, "recovery", untitledRecoveryName))
	}
	return ProjectReference{
		Name:     filepath.Base(canonical),
		Revision: revision,
		Token:    request.Token,
	}, nil
}

func (s *ProjectService) ReopenRecent() (*ProjectReference, error) {
	value, err := s.readPrivateFile("lifecycle", "recent-project.json", s.limits.MaxPreferenceBytes)
	if err != nil {
		var serviceError *ServiceError
		if errors.As(err, &serviceError) && serviceError.Code == ErrorCorruptData {
			if clearErr := s.clearRecent(); clearErr != nil {
				return nil, clearErr
			}
			return nil, nil
		}
		return nil, err
	}
	if len(value) == 0 {
		return nil, nil
	}
	var recent struct {
		Root string `json:"root"`
	}
	if err := json.Unmarshal(value, &recent); err != nil || strings.TrimSpace(recent.Root) == "" {
		if clearErr := s.clearRecent(); clearErr != nil {
			return nil, clearErr
		}
		return nil, nil
	}
	reference, err := s.ApproveRoot(recent.Root)
	if err != nil {
		var serviceError *ServiceError
		if errors.As(err, &serviceError) &&
			(serviceError.Code == ErrorNotFound || serviceError.Code == ErrorInvalidRequest) {
			if clearErr := s.clearRecent(); clearErr != nil {
				return nil, clearErr
			}
			return nil, nil
		}
		return nil, err
	}
	return &reference, nil
}

func (s *ProjectService) ListFiles(token string) ([]FileEntry, error) {
	root, err := s.approvedRoot(token)
	if err != nil {
		return nil, err
	}
	s.ioMu.RLock()
	defer s.ioMu.RUnlock()
	return s.listFilesAtRoot(root)
}

func (s *ProjectService) listFilesAtRoot(root string) ([]FileEntry, error) {
	return s.listFilesAtRootExcluding(root, nil)
}

func (s *ProjectService) listFilesAtRootExcluding(root string, excluded map[string]struct{}) ([]FileEntry, error) {
	entries := make([]FileEntry, 0)
	var total int64
	err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return NewServiceError(ErrorPermissionDenied, "Studio cannot read a project entry.", true, nil)
		}
		if path == root {
			return nil
		}
		if _, skip := excluded[filepath.Clean(path)]; skip {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return NewServiceError(ErrorPermissionDenied, "Studio cannot inspect a project entry.", true, nil)
		}
		if info.Mode()&os.ModeSymlink != 0 || entry.Type()&os.ModeSymlink != 0 {
			return NewServiceError(ErrorPermissionDenied, "Symbolic links are not allowed inside a Studio project.", false, nil)
		}
		if entry.IsDir() {
			return nil
		}
		if !info.Mode().IsRegular() {
			return NewServiceError(ErrorPermissionDenied, "Only regular files are allowed inside a Studio project.", false, nil)
		}
		if info.Size() < 0 || info.Size() > s.limits.MaxFileBytes {
			return NewServiceError(ErrorQuotaExceeded, "A project file exceeds the per-file size limit.", false, nil)
		}
		total += info.Size()
		if total > s.limits.MaxProjectBytes || len(entries)+1 > s.limits.MaxFiles {
			return NewServiceError(ErrorQuotaExceeded, "The project exceeds the supported file-count or expanded-size limit.", false, nil)
		}
		relative, err := filepath.Rel(root, path)
		if err != nil {
			return NewServiceError(ErrorPermissionDenied, "Studio cannot resolve a project entry.", false, nil)
		}
		relative, err = canonicalRelativePath(filepath.ToSlash(relative))
		if err != nil {
			return err
		}
		entries = append(entries, FileEntry{
			MediaType:  mediaType(relative),
			ModifiedAt: info.ModTime().UTC().Format(time.RFC3339Nano),
			Path:       relative,
			Size:       info.Size(),
		})
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Slice(entries, func(left, right int) bool {
		return entries[left].Path < entries[right].Path
	})
	return entries, nil
}

func (s *ProjectService) ReadFile(token, candidate string) ([]byte, error) {
	root, err := s.approvedRoot(token)
	if err != nil {
		return nil, err
	}
	s.ioMu.RLock()
	defer s.ioMu.RUnlock()
	path, err := s.secureExistingFile(root, candidate)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, NewServiceError(ErrorNotFound, "The requested project file does not exist.", true, nil)
		}
		return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot inspect the requested project file.", true, nil)
	}
	if info.Size() > s.limits.MaxFileBytes {
		return nil, NewServiceError(ErrorQuotaExceeded, "The requested project file exceeds the per-file size limit.", false, nil)
	}
	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot read the requested project file.", true, nil)
	}
	if int64(len(bytes)) > s.limits.MaxFileBytes {
		return nil, NewServiceError(ErrorQuotaExceeded, "The requested project file exceeds the per-file size limit.", false, nil)
	}
	return bytes, nil
}

func (s *ProjectService) Revision(token string) (string, error) {
	root, err := s.approvedRoot(token)
	if err != nil {
		return "", err
	}
	s.ioMu.RLock()
	defer s.ioMu.RUnlock()
	return s.revisionForRoot(root)
}

func (s *ProjectService) revisionForRoot(root string) (string, error) {
	return s.revisionForRootExcluding(root, nil)
}

func (s *ProjectService) revisionForRootExcluding(root string, excluded map[string]struct{}) (string, error) {
	entries, err := s.listFilesAtRootExcluding(root, excluded)
	if err != nil {
		return "", err
	}
	hash := sha256.New()
	var total int64
	for _, entry := range entries {
		path, err := s.secureExistingFile(root, entry.Path)
		if err != nil {
			return "", err
		}
		bytes, err := os.ReadFile(path)
		if err != nil {
			return "", NewServiceError(ErrorPermissionDenied, "Studio cannot calculate the project revision.", true, nil)
		}
		total += int64(len(bytes))
		if int64(len(bytes)) > s.limits.MaxFileBytes || total > s.limits.MaxProjectBytes {
			return "", NewServiceError(ErrorQuotaExceeded, "The project changed beyond the supported size limit.", false, nil)
		}
		fmt.Fprintf(hash, "%s\x00%d\x00", entry.Path, len(bytes))
		_, _ = hash.Write(bytes)
	}
	return "sha256-" + hex.EncodeToString(hash.Sum(nil)), nil
}

func (s *ProjectService) CommitFiles(request CommitRequest) (CommitResult, error) {
	if len(request.Files) == 0 {
		return CommitResult{}, NewServiceError(ErrorInvalidRequest, "At least one project file is required.", false, nil)
	}
	s.ioMu.Lock()
	defer s.ioMu.Unlock()
	root, err := s.approvedRoot(request.Token)
	if err != nil {
		return CommitResult{}, err
	}
	actualRevision, err := s.revisionForRoot(root)
	if err != nil {
		return CommitResult{}, err
	}
	if request.ExpectedRevision == "" || request.ExpectedRevision != actualRevision {
		return CommitResult{}, NewServiceError(
			ErrorConflict,
			"The project changed before the save could begin.",
			true,
			map[string]any{
				"actualRevision":   actualRevision,
				"expectedRevision": request.ExpectedRevision,
			},
		)
	}
	if err := s.validateProjectedLimits(root, request.Files); err != nil {
		return CommitResult{}, err
	}

	staged, err := s.stageWrites(root, request.Files)
	if err != nil {
		return CommitResult{}, err
	}
	if err := s.installWrites(staged); err != nil {
		rollbackError := s.rollbackWrites(staged)
		recoveryBackupRetained := s.cleanupAfterRollback(staged, rollbackError)
		return CommitResult{}, NewServiceError(
			ErrorPartialFailure,
			"Studio could not commit every project file; prior files were restored where possible."+rollbackRecoveryMessage(recoveryBackupRetained),
			true,
			rollbackFailureDetails(rollbackError, recoveryBackupRetained),
		)
	}
	revision, err := s.revisionForRootExcluding(root, transactionPaths(staged))
	if err != nil {
		rollbackError := s.rollbackWrites(staged)
		recoveryBackupRetained := s.cleanupAfterRollback(staged, rollbackError)
		return CommitResult{}, NewServiceError(
			ErrorPartialFailure,
			"Studio could not verify the completed project revision; prior files were restored where possible."+rollbackRecoveryMessage(recoveryBackupRetained),
			true,
			rollbackFailureDetails(rollbackError, recoveryBackupRetained),
		)
	}
	s.cleanupWrites(staged)
	s.mu.Lock()
	s.observed[request.Token] = revision
	s.mu.Unlock()
	return CommitResult{Revision: revision}, nil
}

func (s *ProjectService) validateProjectedLimits(root string, writes []CommitWrite) error {
	entries, err := s.listFilesAtRoot(root)
	if err != nil {
		return err
	}
	sizes := make(map[string]int64, len(entries))
	var total int64
	for _, entry := range entries {
		sizes[entry.Path] = entry.Size
		total += entry.Size
	}
	seen := make(map[string]struct{}, len(writes))
	for _, write := range writes {
		relative, err := canonicalRelativePath(write.Path)
		if err != nil {
			return err
		}
		if _, exists := seen[relative]; exists {
			return NewServiceError(ErrorInvalidRequest, "A coordinated save contains the same project path more than once.", false, nil)
		}
		seen[relative] = struct{}{}
		size := int64(len(write.Bytes))
		if size > s.limits.MaxFileBytes {
			return NewServiceError(ErrorQuotaExceeded, "A project file exceeds the per-file size limit.", false, nil)
		}
		if previous, exists := sizes[relative]; exists {
			total -= previous
		} else {
			sizes[relative] = 0
		}
		total += size
		sizes[relative] = size
	}
	if len(sizes) > s.limits.MaxFiles || total > s.limits.MaxProjectBytes {
		return NewServiceError(ErrorQuotaExceeded, "The completed project would exceed the supported file-count or expanded-size limit.", false, nil)
	}
	return nil
}

func (s *ProjectService) stageWrites(root string, writes []CommitWrite) ([]*stagedWrite, error) {
	seen := make(map[string]struct{}, len(writes))
	staged := make([]*stagedWrite, 0, len(writes))
	var total int64
	for _, write := range writes {
		relative, err := canonicalRelativePath(write.Path)
		if err != nil {
			s.cleanupWrites(staged)
			return nil, err
		}
		if _, exists := seen[relative]; exists {
			s.cleanupWrites(staged)
			return nil, NewServiceError(ErrorInvalidRequest, "A coordinated save contains the same project path more than once.", false, nil)
		}
		seen[relative] = struct{}{}
		size := int64(len(write.Bytes))
		total += size
		if size > s.limits.MaxFileBytes || total > s.limits.MaxProjectBytes {
			s.cleanupWrites(staged)
			return nil, NewServiceError(ErrorQuotaExceeded, "The coordinated save exceeds the supported size limit.", false, nil)
		}
		target, err := s.secureWriteTarget(root, relative)
		if err != nil {
			s.cleanupWrites(staged)
			return nil, err
		}
		entry := &stagedWrite{mode: 0o600, path: target}
		if info, statErr := os.Lstat(target); statErr == nil {
			if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
				s.cleanupWrites(staged)
				return nil, NewServiceError(ErrorPermissionDenied, "A save target is not a regular project file.", false, nil)
			}
			entry.existed = true
			entry.mode = info.Mode().Perm()
		} else if !errors.Is(statErr, os.ErrNotExist) {
			s.cleanupWrites(staged)
			return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot inspect a save target.", true, nil)
		}
		stage, err := os.CreateTemp(filepath.Dir(target), ".topoviewer-stage-*")
		if err != nil {
			s.cleanupWrites(staged)
			return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot stage a project file.", true, nil)
		}
		entry.stage = stage.Name()
		if err := stage.Chmod(entry.mode); err == nil {
			_, err = stage.Write(write.Bytes)
		}
		if err == nil {
			err = stage.Sync()
		}
		closeErr := stage.Close()
		if err == nil {
			err = closeErr
		}
		if err != nil {
			s.cleanupWrites(append(staged, entry))
			return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot flush a staged project file.", true, nil)
		}
		if entry.existed {
			backup, err := os.CreateTemp(filepath.Dir(target), ".topoviewer-backup-*")
			if err != nil {
				s.cleanupWrites(append(staged, entry))
				return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot reserve a project backup.", true, nil)
			}
			entry.backup = backup.Name()
			if err := backup.Close(); err != nil {
				s.cleanupWrites(append(staged, entry))
				return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot close a project backup.", true, nil)
			}
			if err := os.Remove(entry.backup); err != nil {
				s.cleanupWrites(append(staged, entry))
				return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot prepare a project backup.", true, nil)
			}
		}
		staged = append(staged, entry)
	}
	return staged, nil
}

func (s *ProjectService) installWrites(staged []*stagedWrite) error {
	for _, entry := range staged {
		if entry.existed {
			if err := s.rename(entry.path, entry.backup); err != nil {
				return err
			}
		}
		if err := s.rename(entry.stage, entry.path); err != nil {
			return err
		}
		entry.installed = true
		entry.stage = ""
	}
	return nil
}

func (s *ProjectService) rollbackWrites(staged []*stagedWrite) error {
	var rollbackError error
	for index := len(staged) - 1; index >= 0; index-- {
		entry := staged[index]
		if entry.installed {
			if err := os.Remove(entry.path); err != nil && !errors.Is(err, os.ErrNotExist) {
				rollbackError = errors.Join(rollbackError, err)
			}
			entry.installed = false
		}
		if entry.backup != "" {
			if _, err := os.Stat(entry.backup); err == nil {
				if err := s.rename(entry.backup, entry.path); err != nil {
					rollbackError = errors.Join(rollbackError, err)
				} else {
					entry.backup = ""
				}
			}
		}
	}
	return rollbackError
}

func transactionPaths(staged []*stagedWrite) map[string]struct{} {
	paths := make(map[string]struct{}, len(staged)*2)
	for _, entry := range staged {
		if entry.stage != "" {
			paths[filepath.Clean(entry.stage)] = struct{}{}
		}
		if entry.backup != "" {
			paths[filepath.Clean(entry.backup)] = struct{}{}
		}
	}
	return paths
}

func (s *ProjectService) cleanupWrites(staged []*stagedWrite) {
	for _, entry := range staged {
		if entry.stage != "" {
			_ = os.Remove(entry.stage)
		}
		if entry.backup != "" {
			_ = os.Remove(entry.backup)
		}
	}
}

func (s *ProjectService) cleanupAfterRollback(staged []*stagedWrite, rollbackError error) bool {
	if rollbackError == nil {
		s.cleanupWrites(staged)
		return false
	}
	recoveryBackupRetained := false
	for _, entry := range staged {
		if entry.stage != "" {
			_ = os.Remove(entry.stage)
		}
		if entry.backup == "" {
			continue
		}
		if info, err := os.Lstat(entry.backup); err == nil && info.Mode().IsRegular() {
			recoveryBackupRetained = true
		}
	}
	return recoveryBackupRetained
}

func rollbackFailureDetails(rollbackError error, recoveryBackupRetained bool) map[string]any {
	return map[string]any{
		"recoveryBackupRetained": recoveryBackupRetained,
		"rollbackSucceeded":      rollbackError == nil,
	}
}

func rollbackRecoveryMessage(recoveryBackupRetained bool) string {
	if !recoveryBackupRetained {
		return ""
	}
	return " A recoverable backup of prior content remains in the project directory."
}

func (s *ProjectService) WritePreference(key string, value json.RawMessage) error {
	if !preferenceKeyPattern.MatchString(key) || !json.Valid(value) {
		return NewServiceError(ErrorInvalidRequest, "The preference key or value is invalid.", false, nil)
	}
	if len(value) > s.limits.MaxPreferenceBytes {
		return NewServiceError(ErrorQuotaExceeded, "The preference exceeds the supported size limit.", false, nil)
	}
	return s.writePrivateFile("preferences", privateName(key), value)
}

func (s *ProjectService) ReadPreference(key string) (json.RawMessage, error) {
	if !preferenceKeyPattern.MatchString(key) {
		return nil, NewServiceError(ErrorInvalidRequest, "The preference key is invalid.", false, nil)
	}
	return s.readPrivateFile("preferences", privateName(key), s.limits.MaxPreferenceBytes)
}

func (s *ProjectService) WriteRecovery(token string, value []byte) error {
	key, err := s.recoveryStorageKey(token)
	if err != nil {
		return err
	}
	if !json.Valid(value) {
		return NewServiceError(ErrorCorruptData, "The recovery snapshot is not valid JSON.", false, nil)
	}
	if len(value) > s.limits.MaxRecoveryBytes {
		return NewServiceError(ErrorQuotaExceeded, "The recovery snapshot exceeds the supported size limit.", false, nil)
	}
	return s.writePrivateFile("recovery", privateName(key), value)
}

func (s *ProjectService) ReadRecovery(token string) ([]byte, error) {
	key, err := s.recoveryStorageKey(token)
	if err != nil {
		return nil, err
	}
	return s.readPrivateFile("recovery", privateName(key), s.limits.MaxRecoveryBytes)
}

func (s *ProjectService) DetectExternalChange(token string) (*ProjectChange, error) {
	revision, err := s.Revision(token)
	if err != nil {
		return nil, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	previous := s.observed[token]
	if previous == "" || previous == revision {
		s.observed[token] = revision
		return nil, nil
	}
	s.observed[token] = revision
	return &ProjectChange{
		Kind:     "changed",
		Paths:    []string{"topology.yaml", "stylesheet.yaml", "mapper.yaml"},
		Revision: revision,
	}, nil
}

func (s *ProjectService) approvedRoot(token string) (string, error) {
	if strings.TrimSpace(token) == "" {
		return "", NewServiceError(ErrorInvalidRequest, "A project authority token is required.", false, nil)
	}
	s.mu.RLock()
	root, ok := s.roots[token]
	s.mu.RUnlock()
	if !ok {
		return "", NewServiceError(ErrorNotFound, "The project authority token is not active.", true, nil)
	}
	if root == "" {
		return "", NewServiceError(ErrorUnavailable, "The untitled project has not been assigned a directory.", true, nil)
	}
	return root, nil
}

func (s *ProjectService) recoveryStorageKey(token string) (string, error) {
	if strings.TrimSpace(token) == "" {
		return "", NewServiceError(ErrorInvalidRequest, "A project authority token is required.", false, nil)
	}
	s.mu.RLock()
	root, ok := s.roots[token]
	s.mu.RUnlock()
	if !ok {
		return "", NewServiceError(ErrorNotFound, "The project authority token is not active.", true, nil)
	}
	if root == "" {
		return "untitled:" + token, nil
	}
	return "directory:" + root, nil
}

func (s *ProjectService) rememberRecent(root string) error {
	value, err := json.Marshal(struct {
		Root string `json:"root"`
	}{Root: root})
	if err != nil {
		return NewServiceError(ErrorUnknown, "Studio could not encode the recent project record.", true, nil)
	}
	return s.writePrivateFile("lifecycle", "recent-project.json", value)
}

func (s *ProjectService) clearRecent() error {
	path := filepath.Join(s.stateDir, "lifecycle", "recent-project.json")
	if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return NewServiceError(ErrorPermissionDenied, "Studio could not remove the recent project record.", true, nil)
	}
	return nil
}

func canonicalDirectory(candidate string) (string, error) {
	if strings.TrimSpace(candidate) == "" {
		return "", NewServiceError(ErrorInvalidRequest, "A project directory is required.", false, nil)
	}
	absolute, err := filepath.Abs(candidate)
	if err != nil {
		return "", NewServiceError(ErrorInvalidRequest, "The selected project directory is invalid.", false, nil)
	}
	canonical, err := filepath.EvalSymlinks(absolute)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", NewServiceError(ErrorNotFound, "The selected project directory does not exist.", true, nil)
		}
		return "", NewServiceError(ErrorPermissionDenied, "Studio cannot resolve the selected project directory.", true, nil)
	}
	info, err := os.Stat(canonical)
	if err != nil || !info.IsDir() {
		return "", NewServiceError(ErrorInvalidRequest, "The selected project root is not a directory.", false, nil)
	}
	return canonical, nil
}

func (s *ProjectService) secureExistingFile(root, candidate string) (string, error) {
	relative, err := canonicalRelativePath(candidate)
	if err != nil {
		return "", err
	}
	path := filepath.Join(root, filepath.FromSlash(relative))
	resolved, err := filepath.EvalSymlinks(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", NewServiceError(ErrorNotFound, "The requested project file does not exist.", true, nil)
		}
		return "", NewServiceError(ErrorPermissionDenied, "Studio cannot resolve the requested project file.", true, nil)
	}
	if !withinRoot(root, resolved) {
		return "", NewServiceError(ErrorPermissionDenied, "The requested project file resolves outside the approved project.", false, nil)
	}
	info, err := os.Lstat(path)
	if err != nil || info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return "", NewServiceError(ErrorPermissionDenied, "The requested project entry is not a regular file.", false, nil)
	}
	return path, nil
}

func (s *ProjectService) secureWriteTarget(root, candidate string) (string, error) {
	relative, err := canonicalRelativePath(candidate)
	if err != nil {
		return "", err
	}
	path := filepath.Join(root, filepath.FromSlash(relative))
	parent := filepath.Dir(path)
	if err := os.MkdirAll(parent, 0o750); err != nil {
		return "", NewServiceError(ErrorPermissionDenied, "Studio cannot create a project directory.", true, nil)
	}
	resolvedParent, err := filepath.EvalSymlinks(parent)
	if err != nil || !withinRoot(root, resolvedParent) {
		return "", NewServiceError(ErrorPermissionDenied, "A save target resolves outside the approved project.", false, nil)
	}
	return path, nil
}

func canonicalRelativePath(candidate string) (string, error) {
	if candidate == "" || strings.ContainsRune(candidate, '\\') || filepath.IsAbs(candidate) || filepath.VolumeName(candidate) != "" {
		return "", NewServiceError(ErrorInvalidRequest, "Project paths must be non-empty relative POSIX paths.", false, nil)
	}
	clean := filepath.ToSlash(filepath.Clean(filepath.FromSlash(candidate)))
	if clean == "." || clean == ".." || strings.HasPrefix(clean, "../") || strings.HasPrefix(clean, "/") {
		return "", NewServiceError(ErrorInvalidRequest, "Project paths cannot leave the approved project.", false, nil)
	}
	return clean, nil
}

func withinRoot(root, candidate string) bool {
	relative, err := filepath.Rel(root, candidate)
	return err == nil && relative != ".." && !strings.HasPrefix(relative, ".."+string(filepath.Separator)) && !filepath.IsAbs(relative)
}

func mediaType(path string) string {
	if value := mime.TypeByExtension(strings.ToLower(filepath.Ext(path))); value != "" {
		return strings.Split(value, ";")[0]
	}
	return "application/octet-stream"
}

func privateName(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:]) + ".json"
}

func (s *ProjectService) writePrivateFile(group, name string, value []byte) error {
	directory := filepath.Join(s.stateDir, group)
	if err := os.MkdirAll(directory, 0o700); err != nil {
		return NewServiceError(ErrorPermissionDenied, "Studio cannot create private application storage.", true, nil)
	}
	if err := os.Chmod(directory, 0o700); err != nil {
		return NewServiceError(ErrorPermissionDenied, "Studio cannot secure private application storage.", true, nil)
	}
	staged, err := os.CreateTemp(directory, ".topoviewer-state-*")
	if err != nil {
		return NewServiceError(ErrorPermissionDenied, "Studio cannot stage private application state.", true, nil)
	}
	stageName := staged.Name()
	defer os.Remove(stageName)
	if err := staged.Chmod(0o600); err == nil {
		_, err = staged.Write(value)
	}
	if err == nil {
		err = staged.Sync()
	}
	closeErr := staged.Close()
	if err == nil {
		err = closeErr
	}
	if err != nil {
		return NewServiceError(ErrorPermissionDenied, "Studio cannot flush private application state.", true, nil)
	}
	if err := os.Rename(stageName, filepath.Join(directory, name)); err != nil {
		return NewServiceError(ErrorPermissionDenied, "Studio cannot commit private application state.", true, nil)
	}
	return nil
}

func (s *ProjectService) readPrivateFile(group, name string, maximum int) ([]byte, error) {
	path := filepath.Join(s.stateDir, group, name)
	info, err := os.Lstat(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil || info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot inspect private application state.", true, nil)
	}
	if info.Size() > int64(maximum) {
		return nil, NewServiceError(ErrorQuotaExceeded, "Private application state exceeds the supported size limit.", false, nil)
	}
	value, err := os.ReadFile(path)
	if err != nil {
		return nil, NewServiceError(ErrorPermissionDenied, "Studio cannot read private application state.", true, nil)
	}
	if len(value) > maximum {
		return nil, NewServiceError(ErrorQuotaExceeded, "Private application state exceeds the supported size limit.", false, nil)
	}
	if !json.Valid(value) {
		return nil, NewServiceError(ErrorCorruptData, "Private application state is not valid JSON.", false, nil)
	}
	return value, nil
}
