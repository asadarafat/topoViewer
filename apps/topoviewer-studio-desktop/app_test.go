package main

import (
	"encoding/base64"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/asadarafat/topoviewer/apps/topoviewer-studio-desktop/internal/native"
)

func requireBridgeError(t *testing.T, err error, code native.ErrorCode) {
	t.Helper()
	var serviceError *native.ServiceError
	if !errors.As(err, &serviceError) {
		t.Fatalf("error = %T %v, want *native.ServiceError", err, err)
	}
	if serviceError.Code != code {
		t.Fatalf("error code = %q, want %q", serviceError.Code, code)
	}
}

func TestDecodeCommitWritesRejectsEmptyAndMalformedRequests(t *testing.T) {
	_, err := decodeCommitWrites(nil)
	requireBridgeError(t, err, native.ErrorInvalidRequest)

	_, err = decodeCommitWrites([]CommitFileRequest{{
		BytesBase64: "not-base64",
		Path:        "topology.yaml",
	}})
	requireBridgeError(t, err, native.ErrorCorruptData)
}

func TestDecodeCommitWritesRejectsCardinalityAndSizeBeforeNativeIO(t *testing.T) {
	limits := native.DefaultLimits()
	tooMany := make([]CommitFileRequest, limits.MaxFiles+1)
	_, err := decodeCommitWrites(tooMany)
	requireBridgeError(t, err, native.ErrorQuotaExceeded)

	_, err = decodeCommitWrites([]CommitFileRequest{{
		BytesBase64: strings.Repeat("A", base64.StdEncoding.EncodedLen(int(limits.MaxFileBytes))+1),
		Path:        "topology.yaml",
	}})
	requireBridgeError(t, err, native.ErrorQuotaExceeded)
}

func TestDecodeCommitWritesRejectsAggregateDecodedSize(t *testing.T) {
	chunk := base64.StdEncoding.EncodeToString(make([]byte, 9*1024*1024))
	files := []CommitFileRequest{
		{BytesBase64: chunk, Path: "topology.yaml"},
		{BytesBase64: chunk, Path: "stylesheet.yaml"},
		{BytesBase64: chunk, Path: "mapper.yaml"},
	}

	_, err := decodeCommitWrites(files)
	requireBridgeError(t, err, native.ErrorQuotaExceeded)
}

func TestDecodeCommitWritesReturnsDecodedFiles(t *testing.T) {
	content := []byte("graph:\n  id: desktop\n")
	writes, err := decodeCommitWrites([]CommitFileRequest{{
		BytesBase64: base64.StdEncoding.EncodeToString(content),
		Path:        "topology.yaml",
	}})
	if err != nil {
		t.Fatalf("decodeCommitWrites() error = %v", err)
	}
	if len(writes) != 1 || writes[0].Path != "topology.yaml" || string(writes[0].Bytes) != string(content) {
		t.Fatalf("writes = %#v", writes)
	}
}

func TestReadSelectedAssetsEnforcesCardinalityAndAggregateLimits(t *testing.T) {
	limits := native.DefaultLimits()
	limits.MaxFiles = 2
	limits.MaxFileBytes = 16
	limits.MaxProjectBytes = 20

	_, err := readSelectedAssets([]string{"one", "two", "three"}, 16, limits)
	requireBridgeError(t, err, native.ErrorQuotaExceeded)

	root := t.TempDir()
	first := filepath.Join(root, "first.png")
	second := filepath.Join(root, "second.png")
	if err := os.WriteFile(first, []byte("123456789012"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(second, []byte("abcdefghijkl"), 0o600); err != nil {
		t.Fatal(err)
	}
	_, err = readSelectedAssets([]string{first, second}, 16, limits)
	requireBridgeError(t, err, native.ErrorQuotaExceeded)
}

func TestReadSelectedAssetsRejectsSymlinksAndReturnsBoundedContent(t *testing.T) {
	limits := native.DefaultLimits()
	limits.MaxFiles = 2
	limits.MaxFileBytes = 32
	limits.MaxProjectBytes = 32

	root := t.TempDir()
	image := filepath.Join(root, "router.svg")
	if err := os.WriteFile(image, []byte("<svg></svg>"), 0o600); err != nil {
		t.Fatal(err)
	}
	link := filepath.Join(root, "linked.svg")
	if err := os.Symlink(image, link); err != nil {
		t.Fatal(err)
	}
	_, err := readSelectedAssets([]string{link}, 32, limits)
	requireBridgeError(t, err, native.ErrorPermissionDenied)

	assets, err := readSelectedAssets([]string{image}, 32, limits)
	if err != nil {
		t.Fatalf("readSelectedAssets() error = %v", err)
	}
	if len(assets) != 1 || assets[0].Name != "router.svg" || assets[0].MediaType != "image/svg+xml" {
		t.Fatalf("assets = %#v", assets)
	}
	if decoded, err := base64.StdEncoding.DecodeString(assets[0].BytesBase64); err != nil || string(decoded) != "<svg></svg>" {
		t.Fatalf("asset bytes = %q, error = %v", decoded, err)
	}
}
