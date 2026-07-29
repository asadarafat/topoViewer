package native

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func testService(t *testing.T, configure func(*ProjectServiceConfig)) *ProjectService {
	t.Helper()
	config := ProjectServiceConfig{
		StateDirectory: t.TempDir(),
		Token:          func() (string, error) { return "opaque-project-token", nil },
	}
	if configure != nil {
		configure(&config)
	}
	service, err := NewProjectService(config)
	if err != nil {
		t.Fatalf("NewProjectService() error = %v", err)
	}
	return service
}

func writeProjectFile(t *testing.T, root, relative, content string) {
	t.Helper()
	target := filepath.Join(root, filepath.FromSlash(relative))
	if err := os.MkdirAll(filepath.Dir(target), 0o750); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	if err := os.WriteFile(target, []byte(content), 0o600); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}
}

func validProject(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	writeProjectFile(t, root, "topology.yaml", "graph:\n  id: desktop\n  nodes: []\n  links: []\n")
	writeProjectFile(t, root, "stylesheet.yaml", "stylesheet: []\n")
	writeProjectFile(t, root, "assets/router.svg", "<svg/>")
	return root
}

func requireServiceError(t *testing.T, err error, code ErrorCode) *ServiceError {
	t.Helper()
	var serviceError *ServiceError
	if !errors.As(err, &serviceError) {
		t.Fatalf("error = %T %v, want *ServiceError", err, err)
	}
	if serviceError.Code != code {
		t.Fatalf("error code = %q, want %q", serviceError.Code, code)
	}
	return serviceError
}

func TestApproveRootReturnsOpaqueReferenceAndBoundedRelativeInventory(t *testing.T) {
	root := validProject(t)
	service := testService(t, nil)

	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	if reference.Token != "opaque-project-token" || reference.Name != filepath.Base(root) {
		t.Fatalf("ApproveRoot() = %#v", reference)
	}
	encoded, err := json.Marshal(reference)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	if bytes.Contains(encoded, []byte(root)) {
		t.Fatalf("project reference leaked root: %s", encoded)
	}

	files, err := service.ListFiles(reference.Token)
	if err != nil {
		t.Fatalf("ListFiles() error = %v", err)
	}
	got := make([]string, 0, len(files))
	for _, file := range files {
		got = append(got, file.Path)
		if filepath.IsAbs(file.Path) || strings.Contains(file.Path, "..") {
			t.Fatalf("unsafe file path returned: %q", file.Path)
		}
	}
	want := []string{"assets/router.svg", "stylesheet.yaml", "topology.yaml"}
	if strings.Join(got, ",") != strings.Join(want, ",") {
		t.Fatalf("ListFiles() paths = %v, want %v", got, want)
	}
}

func TestApproveRootRequiresExplicitRecentPromotion(t *testing.T) {
	root := validProject(t)
	state := t.TempDir()
	tokenIndex := 0
	newService := func() *ProjectService {
		return testService(t, func(config *ProjectServiceConfig) {
			config.StateDirectory = state
			config.Token = func() (string, error) {
				tokenIndex++
				return fmt.Sprintf("opaque-token-%d", tokenIndex), nil
			}
		})
	}

	service := newService()
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	if recent, reopenErr := newService().ReopenRecent(); reopenErr != nil || recent != nil {
		t.Fatalf("ReopenRecent() before promotion = %#v, %v", recent, reopenErr)
	}
	if err := service.PromoteRecent(reference.Token); err != nil {
		t.Fatalf("PromoteRecent() error = %v", err)
	}
	recent, err := newService().ReopenRecent()
	if err != nil {
		t.Fatalf("ReopenRecent() after promotion error = %v", err)
	}
	if recent == nil || recent.Name != filepath.Base(root) {
		t.Fatalf("ReopenRecent() after promotion = %#v", recent)
	}
	if err := service.ForgetRecent(reference.Token); err != nil {
		t.Fatalf("ForgetRecent() error = %v", err)
	}
	if recent, reopenErr := newService().ReopenRecent(); reopenErr != nil || recent != nil {
		t.Fatalf("ReopenRecent() after forget = %#v, %v", recent, reopenErr)
	}
}

func TestReopenRecentRemovesCorruptAndMissingLifecycleRecords(t *testing.T) {
	state := t.TempDir()
	lifecycle := filepath.Join(state, "lifecycle")
	if err := os.MkdirAll(lifecycle, 0o700); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	recentPath := filepath.Join(lifecycle, "recent-project.json")
	if err := os.WriteFile(recentPath, []byte("{not-json"), 0o600); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}
	newService := func(token string) *ProjectService {
		return testService(t, func(config *ProjectServiceConfig) {
			config.StateDirectory = state
			config.Token = func() (string, error) { return token, nil }
		})
	}

	recent, err := newService("corrupt-record-token").ReopenRecent()
	if err != nil || recent != nil {
		t.Fatalf("ReopenRecent() corrupt record = %#v, %v", recent, err)
	}
	if _, err := os.Stat(recentPath); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("corrupt recent record still exists: %v", err)
	}

	root := validProject(t)
	service := newService("approved-root-token")
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	if err := service.PromoteRecent(reference.Token); err != nil {
		t.Fatalf("PromoteRecent() error = %v", err)
	}
	if err := os.RemoveAll(root); err != nil {
		t.Fatalf("RemoveAll() error = %v", err)
	}

	recent, err = newService("missing-root-token").ReopenRecent()
	if err != nil || recent != nil {
		t.Fatalf("ReopenRecent() missing root = %#v, %v", recent, err)
	}
	if _, err := os.Stat(recentPath); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("missing-root recent record still exists: %v", err)
	}
}

func TestSaveUntitledProjectCommitsBeforeBindingAndReopensRecent(t *testing.T) {
	root := t.TempDir()
	state := t.TempDir()
	tokenIndex := 0
	service := testService(t, func(config *ProjectServiceConfig) {
		config.StateDirectory = state
		config.Token = func() (string, error) {
			tokenIndex++
			return fmt.Sprintf("opaque-token-%d", tokenIndex), nil
		}
	})

	untitled, err := service.ReserveProject("Untitled topology")
	if err != nil {
		t.Fatalf("ReserveProject() error = %v", err)
	}
	if untitled.Token != "opaque-token-1" || untitled.Revision != "untitled" {
		t.Fatalf("ReserveProject() = %#v", untitled)
	}
	recovery := []byte(`{"capturedAt":"2026-07-29T09:00:00Z","project":{"id":"opaque-token-1"}}`)
	if err := service.WriteRecovery(untitled.Token, recovery); err != nil {
		t.Fatalf("WriteRecovery() error = %v", err)
	}

	saved, err := service.SaveUntitledProject(FirstSaveRequest{
		ExpectedRevision: untitled.Revision,
		Files: []CommitWrite{
			{Bytes: []byte("graph:\n  id: desktop\n  nodes: []\n  links: []\n"), Path: "topology.yaml"},
			{Bytes: []byte("stylesheet: []\n"), Path: "stylesheet.yaml"},
		},
		Root:  root,
		Token: untitled.Token,
	})
	if err != nil {
		t.Fatalf("SaveUntitledProject() error = %v", err)
	}
	if saved.Token != untitled.Token || saved.Revision == "untitled" {
		t.Fatalf("SaveUntitledProject() = %#v", saved)
	}
	gotRecovery, err := service.ReadRecovery(saved.Token)
	if err != nil || !bytes.Equal(gotRecovery, recovery) {
		t.Fatalf("ReadRecovery() = %s, %v", gotRecovery, err)
	}

	restarted := testService(t, func(config *ProjectServiceConfig) {
		config.StateDirectory = state
		config.Token = func() (string, error) { return "opaque-token-after-restart", nil }
	})
	recent, err := restarted.ReopenRecent()
	if err != nil {
		t.Fatalf("ReopenRecent() error = %v", err)
	}
	if recent == nil || recent.Token != "opaque-token-after-restart" || recent.Name != filepath.Base(root) {
		t.Fatalf("ReopenRecent() = %#v", recent)
	}
}

func TestSaveUntitledProjectRejectsNonEmptyDirectoryWithoutBindingToken(t *testing.T) {
	root := validProject(t)
	service := testService(t, nil)
	untitled, err := service.ReserveProject("Untitled topology")
	if err != nil {
		t.Fatalf("ReserveProject() error = %v", err)
	}

	if _, err := service.SaveUntitledProject(FirstSaveRequest{
		ExpectedRevision: untitled.Revision,
		Files:            []CommitWrite{{Bytes: []byte("graph:\n  id: desktop\n"), Path: "topology.yaml"}},
		Root:             root,
		Token:            untitled.Token,
	}); err == nil {
		t.Fatal("SaveUntitledProject() accepted a non-empty first-save directory")
	} else {
		requireServiceError(t, err, ErrorConflict)
	}
	if err := service.WriteRecovery(untitled.Token, []byte(`{"capturedAt":"2026-07-29T09:00:00Z"}`)); err != nil {
		t.Fatalf("WriteRecovery() after rejected bind error = %v", err)
	}
}

func TestSaveUntitledProjectRollsBackAndKeepsUntitledAuthorityAfterInstallFailure(t *testing.T) {
	root := t.TempDir()
	renameCalls := 0
	service := testService(t, func(config *ProjectServiceConfig) {
		config.Rename = func(oldPath, newPath string) error {
			renameCalls++
			if renameCalls == 2 {
				return errors.New("injected first-save rename failure")
			}
			return os.Rename(oldPath, newPath)
		}
	})
	untitled, err := service.ReserveProject("Untitled topology")
	if err != nil {
		t.Fatalf("ReserveProject() error = %v", err)
	}
	recovery := []byte(`{"capturedAt":"2026-07-29T09:00:00Z"}`)
	if err := service.WriteRecovery(untitled.Token, recovery); err != nil {
		t.Fatalf("WriteRecovery() error = %v", err)
	}

	_, err = service.SaveUntitledProject(FirstSaveRequest{
		ExpectedRevision: untitled.Revision,
		Files: []CommitWrite{
			{Bytes: []byte("graph:\n  id: desktop\n"), Path: "topology.yaml"},
			{Bytes: []byte("stylesheet: []\n"), Path: "stylesheet.yaml"},
		},
		Root:  root,
		Token: untitled.Token,
	})
	requireServiceError(t, err, ErrorPartialFailure)
	entries, readErr := os.ReadDir(root)
	if readErr != nil {
		t.Fatalf("ReadDir() error = %v", readErr)
	}
	if len(entries) != 0 {
		t.Fatalf("failed first save left destination content: %#v", entries)
	}
	gotRecovery, readErr := service.ReadRecovery(untitled.Token)
	if readErr != nil || !bytes.Equal(gotRecovery, recovery) {
		t.Fatalf("untitled recovery after failure = %s, %v", gotRecovery, readErr)
	}
	if recent, reopenErr := service.ReopenRecent(); reopenErr != nil || recent != nil {
		t.Fatalf("ReopenRecent() after failure = %#v, %v", recent, reopenErr)
	}
}

func TestReadFileRejectsTraversalAbsolutePathsAndSymlinks(t *testing.T) {
	root := validProject(t)
	service := testService(t, nil)
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}

	for _, candidate := range []string{"../outside.yaml", "/tmp/outside.yaml", `C:\outside.yaml`, ""} {
		if _, err := service.ReadFile(reference.Token, candidate); err == nil {
			t.Fatalf("ReadFile(%q) succeeded", candidate)
		} else {
			requireServiceError(t, err, ErrorInvalidRequest)
		}
	}

	outside := filepath.Join(t.TempDir(), "outside.svg")
	if err := os.WriteFile(outside, []byte("<svg/>"), 0o600); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}
	if err := os.Symlink(outside, filepath.Join(root, "assets", "linked.svg")); err != nil {
		t.Fatalf("Symlink() error = %v", err)
	}
	if _, err := service.ListFiles(reference.Token); err == nil {
		t.Fatal("ListFiles() accepted a symbolic link")
	} else {
		requireServiceError(t, err, ErrorPermissionDenied)
	}
}

func TestApproveRootEnforcesCardinalityAndByteLimits(t *testing.T) {
	root := validProject(t)
	service := testService(t, func(config *ProjectServiceConfig) {
		config.Limits = Limits{
			MaxFileBytes:       32,
			MaxFiles:           3,
			MaxPreferenceBytes: 64,
			MaxProjectBytes:    64,
			MaxRecoveryBytes:   64,
		}
	})
	if _, err := service.ApproveRoot(root); err == nil {
		t.Fatal("ApproveRoot() accepted an oversized project")
	} else {
		requireServiceError(t, err, ErrorQuotaExceeded)
	}
}

func TestCommitFilesChecksRevisionAndCommitsDocumentsTogether(t *testing.T) {
	root := validProject(t)
	service := testService(t, nil)
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	revision, err := service.Revision(reference.Token)
	if err != nil {
		t.Fatalf("Revision() error = %v", err)
	}

	result, err := service.CommitFiles(CommitRequest{
		ExpectedRevision: revision,
		Files: []CommitWrite{
			{Bytes: []byte("graph:\n  id: changed\n  nodes: []\n  links: []\n"), Path: "topology.yaml"},
			{Bytes: []byte("stylesheet:\n  - selector: node\n    style: {}\n"), Path: "stylesheet.yaml"},
		},
		Token: reference.Token,
	})
	if err != nil {
		t.Fatalf("CommitFiles() error = %v", err)
	}
	if result.Revision == revision {
		t.Fatal("CommitFiles() did not advance revision")
	}
	topology, _ := os.ReadFile(filepath.Join(root, "topology.yaml"))
	stylesheet, _ := os.ReadFile(filepath.Join(root, "stylesheet.yaml"))
	if !bytes.Contains(topology, []byte("id: changed")) || !bytes.Contains(stylesheet, []byte("selector: node")) {
		t.Fatalf("coordinated files not committed: topology=%q stylesheet=%q", topology, stylesheet)
	}

	_, err = service.CommitFiles(CommitRequest{
		ExpectedRevision: revision,
		Files:            []CommitWrite{{Bytes: []byte("must not win"), Path: "topology.yaml"}},
		Token:            reference.Token,
	})
	conflict := requireServiceError(t, err, ErrorConflict)
	if conflict.Details["expectedRevision"] != revision || conflict.Details["actualRevision"] != result.Revision {
		t.Fatalf("conflict details = %#v", conflict.Details)
	}
}

func TestCommitFilesRollsBackEveryTargetAfterRenameFailure(t *testing.T) {
	root := validProject(t)
	renameCalls := 0
	service := testService(t, func(config *ProjectServiceConfig) {
		config.Rename = func(oldPath, newPath string) error {
			renameCalls++
			if renameCalls == 4 {
				return errors.New("injected rename failure")
			}
			return os.Rename(oldPath, newPath)
		}
	})
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	revision, _ := service.Revision(reference.Token)
	beforeTopology, _ := os.ReadFile(filepath.Join(root, "topology.yaml"))
	beforeStylesheet, _ := os.ReadFile(filepath.Join(root, "stylesheet.yaml"))

	_, err = service.CommitFiles(CommitRequest{
		ExpectedRevision: revision,
		Files: []CommitWrite{
			{Bytes: []byte("new topology"), Path: "topology.yaml"},
			{Bytes: []byte("new stylesheet"), Path: "stylesheet.yaml"},
		},
		Token: reference.Token,
	})
	requireServiceError(t, err, ErrorPartialFailure)
	afterTopology, _ := os.ReadFile(filepath.Join(root, "topology.yaml"))
	afterStylesheet, _ := os.ReadFile(filepath.Join(root, "stylesheet.yaml"))
	if !bytes.Equal(beforeTopology, afterTopology) || !bytes.Equal(beforeStylesheet, afterStylesheet) {
		t.Fatalf("rollback changed project: topology=%q stylesheet=%q", afterTopology, afterStylesheet)
	}
	matches, _ := filepath.Glob(filepath.Join(root, ".topoviewer-*"))
	if len(matches) != 0 {
		t.Fatalf("transaction files remain: %v", matches)
	}
}

func TestCommitFilesRetainsPriorContentWhenRollbackItselfFails(t *testing.T) {
	root := validProject(t)
	renameCalls := 0
	service := testService(t, func(config *ProjectServiceConfig) {
		config.Rename = func(oldPath, newPath string) error {
			renameCalls++
			if renameCalls == 4 || renameCalls == 6 {
				return errors.New("injected rename failure")
			}
			return os.Rename(oldPath, newPath)
		}
	})
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	revision, _ := service.Revision(reference.Token)
	beforeTopology, _ := os.ReadFile(filepath.Join(root, "topology.yaml"))

	_, err = service.CommitFiles(CommitRequest{
		ExpectedRevision: revision,
		Files: []CommitWrite{
			{Bytes: []byte("new topology"), Path: "topology.yaml"},
			{Bytes: []byte("new stylesheet"), Path: "stylesheet.yaml"},
		},
		Token: reference.Token,
	})
	failure := requireServiceError(t, err, ErrorPartialFailure)
	if failure.Details["rollbackSucceeded"] != false || failure.Details["recoveryBackupRetained"] != true {
		t.Fatalf("partial failure details = %#v", failure.Details)
	}
	backups, globErr := filepath.Glob(filepath.Join(root, ".topoviewer-backup-*"))
	if globErr != nil || len(backups) != 1 {
		t.Fatalf("recovery backups = %v, %v", backups, globErr)
	}
	recovered, readErr := os.ReadFile(backups[0])
	if readErr != nil || !bytes.Equal(recovered, beforeTopology) {
		t.Fatalf("retained backup = %q, %v; want prior topology", recovered, readErr)
	}
}

func TestCommitFilesRollsBackWhenCompletedRevisionCannotBeVerified(t *testing.T) {
	root := validProject(t)
	renameCalls := 0
	service := testService(t, func(config *ProjectServiceConfig) {
		config.Limits = Limits{
			MaxFileBytes:       1024,
			MaxFiles:           8,
			MaxPreferenceBytes: 1024,
			MaxProjectBytes:    4096,
			MaxRecoveryBytes:   1024,
		}
		config.Rename = func(oldPath, newPath string) error {
			renameCalls++
			if err := os.Rename(oldPath, newPath); err != nil {
				return err
			}
			if renameCalls == 2 {
				return os.WriteFile(filepath.Join(root, "external-oversized.bin"), bytes.Repeat([]byte("x"), 2048), 0o600)
			}
			return nil
		}
	})
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	revision, err := service.Revision(reference.Token)
	if err != nil {
		t.Fatalf("Revision() error = %v", err)
	}
	before, err := os.ReadFile(filepath.Join(root, "topology.yaml"))
	if err != nil {
		t.Fatalf("ReadFile() error = %v", err)
	}

	_, err = service.CommitFiles(CommitRequest{
		ExpectedRevision: revision,
		Files:            []CommitWrite{{Bytes: []byte("changed topology"), Path: "topology.yaml"}},
		Token:            reference.Token,
	})
	failure := requireServiceError(t, err, ErrorPartialFailure)
	if failure.Details["rollbackSucceeded"] != true {
		t.Fatalf("partial failure details = %#v", failure.Details)
	}
	after, readErr := os.ReadFile(filepath.Join(root, "topology.yaml"))
	if readErr != nil || !bytes.Equal(before, after) {
		t.Fatalf("failed revision verification changed topology: %q, %v", after, readErr)
	}
	if err := os.Remove(filepath.Join(root, "external-oversized.bin")); err != nil {
		t.Fatalf("Remove() error = %v", err)
	}
	restoredRevision, err := service.Revision(reference.Token)
	if err != nil || restoredRevision != revision {
		t.Fatalf("restored revision = %q, %v; want %q", restoredRevision, err, revision)
	}
}

func TestCommitFilesRejectsProjectedProjectLimitWithoutMutation(t *testing.T) {
	root := validProject(t)
	service := testService(t, func(config *ProjectServiceConfig) {
		config.Limits = Limits{
			MaxFileBytes:       1024,
			MaxFiles:           3,
			MaxPreferenceBytes: 1024,
			MaxProjectBytes:    1024 * 1024,
			MaxRecoveryBytes:   1024,
		}
	})
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	revision, err := service.Revision(reference.Token)
	if err != nil {
		t.Fatalf("Revision() error = %v", err)
	}
	before, err := os.ReadFile(filepath.Join(root, "topology.yaml"))
	if err != nil {
		t.Fatalf("ReadFile() error = %v", err)
	}

	_, err = service.CommitFiles(CommitRequest{
		ExpectedRevision: revision,
		Files:            []CommitWrite{{Bytes: []byte("mapper: []\n"), Path: "mapper.yaml"}},
		Token:            reference.Token,
	})
	requireServiceError(t, err, ErrorQuotaExceeded)
	after, readErr := os.ReadFile(filepath.Join(root, "topology.yaml"))
	if readErr != nil || !bytes.Equal(before, after) {
		t.Fatalf("rejected save changed topology: %q, %v", after, readErr)
	}
	if _, statErr := os.Stat(filepath.Join(root, "mapper.yaml")); !errors.Is(statErr, os.ErrNotExist) {
		t.Fatalf("rejected save created mapper.yaml: %v", statErr)
	}
}

func TestCommitFilesSerializesConcurrentRevisionChecks(t *testing.T) {
	root := validProject(t)
	var renameCalls atomic.Int32
	firstRenameStarted := make(chan struct{})
	unblockFirstRename := make(chan struct{})
	concurrentRename := make(chan struct{})
	service := testService(t, func(config *ProjectServiceConfig) {
		config.Rename = func(oldPath, newPath string) error {
			call := renameCalls.Add(1)
			if call == 1 {
				close(firstRenameStarted)
				<-unblockFirstRename
			} else if call == 2 {
				close(concurrentRename)
			}
			return os.Rename(oldPath, newPath)
		}
	})
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	revision, err := service.Revision(reference.Token)
	if err != nil {
		t.Fatalf("Revision() error = %v", err)
	}
	commit := func(content string, result chan<- error) {
		_, err := service.CommitFiles(CommitRequest{
			ExpectedRevision: revision,
			Files:            []CommitWrite{{Bytes: []byte(content), Path: "topology.yaml"}},
			Token:            reference.Token,
		})
		result <- err
	}
	firstResult := make(chan error, 1)
	secondResult := make(chan error, 1)
	go commit("first commit", firstResult)
	<-firstRenameStarted
	go commit("second commit", secondResult)

	overlapped := false
	select {
	case <-concurrentRename:
		overlapped = true
	case <-time.After(250 * time.Millisecond):
	}
	close(unblockFirstRename)
	firstErr := <-firstResult
	secondErr := <-secondResult
	if overlapped {
		t.Fatal("a second commit entered replacement before the first commit completed")
	}
	if firstErr != nil {
		t.Fatalf("first CommitFiles() error = %v", firstErr)
	}
	requireServiceError(t, secondErr, ErrorConflict)
}

func TestPreferencesAndRecoveryStayInPrivateStateDirectory(t *testing.T) {
	root := validProject(t)
	state := t.TempDir()
	service := testService(t, func(config *ProjectServiceConfig) {
		config.StateDirectory = state
	})
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}

	preference := json.RawMessage(`{"mode":"dark"}`)
	if err := service.WritePreference("studio.appearance", preference); err != nil {
		t.Fatalf("WritePreference() error = %v", err)
	}
	gotPreference, err := service.ReadPreference("studio.appearance")
	if err != nil || !bytes.Equal(gotPreference, preference) {
		t.Fatalf("ReadPreference() = %s, %v", gotPreference, err)
	}
	recovery := []byte(`{"capturedAt":"2026-07-29T09:00:00Z"}`)
	if err := service.WriteRecovery(reference.Token, recovery); err != nil {
		t.Fatalf("WriteRecovery() error = %v", err)
	}
	gotRecovery, err := service.ReadRecovery(reference.Token)
	if err != nil || !bytes.Equal(gotRecovery, recovery) {
		t.Fatalf("ReadRecovery() = %s, %v", gotRecovery, err)
	}
	if _, err := os.Stat(filepath.Join(root, "preferences.json")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("preference leaked into project root: %v", err)
	}
}

func TestDetectExternalChangeSuppressesCommittedRevisionAndSupportsCancellationError(t *testing.T) {
	root := validProject(t)
	service := testService(t, nil)
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatalf("ApproveRoot() error = %v", err)
	}
	revision, _ := service.Revision(reference.Token)
	commit, err := service.CommitFiles(CommitRequest{
		ExpectedRevision: revision,
		Files:            []CommitWrite{{Bytes: []byte("graph:\n  id: own-write\n"), Path: "topology.yaml"}},
		Token:            reference.Token,
	})
	if err != nil {
		t.Fatalf("CommitFiles() error = %v", err)
	}
	change, err := service.DetectExternalChange(reference.Token)
	if err != nil || change != nil {
		t.Fatalf("self-write change = %#v, %v", change, err)
	}

	writeProjectFile(t, root, "topology.yaml", "graph:\n  id: external-write\n")
	change, err = service.DetectExternalChange(reference.Token)
	if err != nil {
		t.Fatalf("DetectExternalChange() error = %v", err)
	}
	if change == nil || change.Kind != "changed" || change.Revision == commit.Revision {
		t.Fatalf("external change = %#v", change)
	}

	cancelled := NewServiceError(ErrorCancelled, "Folder selection was cancelled.", true, nil)
	requireServiceError(t, cancelled, ErrorCancelled)
}
