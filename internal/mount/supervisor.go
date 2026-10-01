package mount

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gdrive-supply/internal/config"
)

type ProcessEntry struct {
	DriveID     string
	DriveLetter string
	Cmd         *exec.Cmd
	StartedAt   time.Time
}

type Supervisor struct {
	mu        sync.RWMutex
	processes map[string]*ProcessEntry // Key: DriveID
	binDir    string
	rclonePath string
}


var (
	globalSupervisor *Supervisor
	supOnce          sync.Once
)

func GetSupervisor() *Supervisor {
	supOnce.Do(func() {
		exePath, _ := os.Executable()
		baseDir := filepath.Dir(exePath)
		// Fallback to current working directory if run via go run
		if strings.Contains(baseDir, "Temp") || strings.Contains(baseDir, "temp") {
			baseDir, _ = os.Getwd()
		}
		binDir := filepath.Join(baseDir, "bin")
		_ = os.MkdirAll(binDir, 0755)

		s := &Supervisor{
			processes: make(map[string]*ProcessEntry),
			binDir:    binDir,
		}
		s.locateOrPrepareRclone()
		globalSupervisor = s
	})
	return globalSupervisor
}

// locateOrPrepareRclone checks if rclone is in PATH or in bin/
func (s *Supervisor) locateOrPrepareRclone() {
	if path, err := exec.LookPath("rclone.exe"); err == nil {
		s.rclonePath = path
		return
	}
	localBin := filepath.Join(s.binDir, "rclone.exe")
	if _, err := os.Stat(localBin); err == nil {
		s.rclonePath = localBin
		return
	}
	s.rclonePath = localBin // Will trigger auto download if needed
}

// EnsureRcloneDownloaded downloads rclone.exe if missing
func (s *Supervisor) EnsureRcloneDownloaded() error {
	if _, err := os.Stat(s.rclonePath); err == nil {
		return nil
	}


	downloadURL := "https://downloads.rclone.org/rclone-current-windows-amd64.zip"
	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("failed to download rclone: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("rclone download returned HTTP %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read download stream: %w", err)
	}

	zipReader, err := zip.NewReader(bytes.NewReader(bodyBytes), int64(len(bodyBytes)))
	if err != nil {
		return fmt.Errorf("failed to parse zip: %w", err)
	}

	for _, file := range zipReader.File {
		if filepath.Base(file.Name) == "rclone.exe" {
			rc, err := file.Open()
			if err != nil {
				return err
			}
			defer rc.Close()

			targetFile, err := os.OpenFile(s.rclonePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
			if err != nil {
				return err
			}
			defer targetFile.Close()

			if _, err := io.Copy(targetFile, rc); err != nil {
				return err
			}
			return nil
		}
	}

	return fmt.Errorf("rclone.exe not found inside official zip archive")
}

// CheckWinFspInstalled checks if WinFsp kernel driver is installed on Windows
func CheckWinFspInstalled() bool {
	paths := []string{
		`C:\Program Files\WinFsp`,
		`C:\Program Files (x86)\WinFsp`,
	}
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			return true
		}
	}
	return false
}

// MountDrive launches rclone mount for a drive config
func (s *Supervisor) MountDrive(drive *config.DriveConfig, clientID, clientSecret, refreshToken string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// If already mounted, skip
	if _, ok := s.processes[drive.ID]; ok {
		return nil
	}

	if err := s.EnsureRcloneDownloaded(); err != nil {
		return fmt.Errorf("persiapan engine rclone gagal: %w", err)
	}

	if !CheckWinFspInstalled() {
		return fmt.Errorf("driver WinFsp belum terpasang di komputer. Silakan install WinFsp dari https://winfsp.dev/rel/")
	}

	// Obtain fresh OAuth token JSON blob using TokenSource
	ctx := context.Background()
	oauthConf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
	}
	ts := oauthConf.TokenSource(ctx, &oauth2.Token{
		RefreshToken: refreshToken,
	})
	freshTok, err := ts.Token()
	if err != nil {
		return fmt.Errorf("gagal mendapatkan token akses Google: %w", err)
	}

	tokBytes, err := json.Marshal(freshTok)
	if err != nil {
		return fmt.Errorf("gagal serialisasi token: %w", err)
	}

	// Create temporary rclone config file for this mount
	tempConf := filepath.Join(s.binDir, fmt.Sprintf("rclone_%s.conf", drive.ID))
	confContent := fmt.Sprintf(`[%s]
type = drive
client_id = %s
client_secret = %s
token = %s
scope = drive
`, drive.ID, clientID, clientSecret, string(tokBytes))

	if err := os.WriteFile(tempConf, []byte(confContent), 0600); err != nil {
		return fmt.Errorf("gagal menulis config rclone: %w", err)
	}

	volName := strings.TrimSpace(drive.VolumeLabel)
	if volName == "" {
		volName = fmt.Sprintf("GDrive_%s", strings.TrimSuffix(drive.DriveLetter, ":"))
	}
	args := []string{
		"mount",
		fmt.Sprintf("%s:", drive.ID),
		drive.DriveLetter,
		"--config", tempConf,
		"--vfs-cache-mode", "full",
		"--vfs-cache-max-size", "10G",
		"--vfs-read-chunk-size", "32M",
		"--vfs-read-chunk-size-limit", "256M",
		"--dir-cache-time", "1h",
		"--volname", volName,
		"--no-console",
	}

	cmd := exec.Command(s.rclonePath, args...)
	// Hide console window on Windows
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}

	errCh := make(chan error, 1)

	if err := cmd.Start(); err != nil {
		_ = os.Remove(tempConf)
		return fmt.Errorf("gagal menjalankan proses mount: %w", err)
	}

	go func() {
		errCh <- cmd.Wait()
		s.mu.Lock()
		delete(s.processes, drive.ID)
		s.mu.Unlock()
		_ = os.Remove(tempConf)
	}()

	select {
	case exitErr := <-errCh:
		s.mu.Lock()
		delete(s.processes, drive.ID)
		s.mu.Unlock()
		_ = os.Remove(tempConf)
		return fmt.Errorf("proses mount berhenti seketika (%v). Pastikan huruf drive %s belum dipakai", exitErr, drive.DriveLetter)
	case <-time.After(1500 * time.Millisecond):
		// rclone successfully started and running
	}

	s.processes[drive.ID] = &ProcessEntry{
		DriveID:     drive.ID,
		DriveLetter: drive.DriveLetter,
		Cmd:         cmd,
		StartedAt:   time.Now(),
	}

	return nil
}

// UnmountDrive terminates the rclone mount process and cleans up
func (s *Supervisor) UnmountDrive(driveID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry, ok := s.processes[driveID]
	if !ok {
		return nil
	}

	if entry.Cmd != nil && entry.Cmd.Process != nil {
		_ = entry.Cmd.Process.Kill()
		_ = entry.Cmd.Wait()
	}

	delete(s.processes, driveID)
	tempConf := filepath.Join(s.binDir, fmt.Sprintf("rclone_%s.conf", driveID))
	_ = os.Remove(tempConf)
	return nil
}

// IsMounted returns true if the drive process is running
func (s *Supervisor) IsMounted(driveID string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()


	entry, ok := s.processes[driveID]
	if !ok {
		return false
	}
	return entry.Cmd != nil && entry.Cmd.ProcessState == nil
}
