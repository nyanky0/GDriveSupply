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
	"gdrive-supply/internal/logger"
)

type ProcessEntry struct {
	DriveID     string
	DriveLetter string
	Cmd         *exec.Cmd
	StartedAt   time.Time
	RcPort      int
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

	letter := strings.ToUpper(strings.TrimSuffix(drive.DriveLetter, ":"))
	rcPort := 5572
	if len(letter) > 0 && letter[0] >= 'A' && letter[0] <= 'Z' {
		rcPort = 5572 + int(letter[0]-'A')
	}
	rcAddr := fmt.Sprintf("127.0.0.1:%d", rcPort)

	args := []string{
		"mount",
		fmt.Sprintf("%s:", drive.ID),
		drive.DriveLetter,
		"--config", tempConf,
		"--vfs-cache-mode", "full",
		"--vfs-cache-max-size", "10G",
		"--vfs-write-back", "2s",
		"--vfs-read-chunk-size", "32M",
		"--vfs-read-chunk-size-limit", "256M",
		"--dir-cache-time", "1h",
		"--volname", volName,
		"--rc",
		"--rc-addr", rcAddr,
		"--rc-no-auth",
		"-v",
	}

	logger.Get().Infof("MOUNT", "Menjalankan perintah rclone mount untuk drive %s (%s, RC: %s)...", drive.DriveLetter, drive.ID, rcAddr)

	cmd := exec.Command(s.rclonePath, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		_ = os.Remove(tempConf)
		return fmt.Errorf("gagal pipe stdout: %w", err)
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		_ = os.Remove(tempConf)
		return fmt.Errorf("gagal pipe stderr: %w", err)
	}

	errCh := make(chan error, 1)

	if err := cmd.Start(); err != nil {
		_ = os.Remove(tempConf)
		logger.Get().Errorf("MOUNT", "Gagal menjalankan proses rclone: %v", err)
		return fmt.Errorf("gagal menjalankan proses mount: %w", err)
	}

	logger.Get().PipeProcessOutput(fmt.Sprintf("VFS-%s", drive.DriveLetter), stdoutPipe, stderrPipe)

	go func() {
		exitErr := cmd.Wait()
		errCh <- exitErr
		s.mu.Lock()
		delete(s.processes, drive.ID)
		s.mu.Unlock()
		_ = os.Remove(tempConf)
		if exitErr != nil {
			logger.Get().Warnf("MOUNT", "Proses rclone drive %s (%s) berhenti: %v", drive.DriveLetter, drive.ID, exitErr)
		} else {
			logger.Get().Infof("MOUNT", "Proses rclone drive %s (%s) selesai dengan normal", drive.DriveLetter, drive.ID)
		}
	}()

	select {
	case exitErr := <-errCh:
		s.mu.Lock()
		delete(s.processes, drive.ID)
		s.mu.Unlock()
		_ = os.Remove(tempConf)
		errMsg := fmt.Sprintf("proses mount berhenti seketika (%v). Pastikan huruf drive %s belum dipakai", exitErr, drive.DriveLetter)
		logger.Get().Errorf("MOUNT", errMsg)
		return fmt.Errorf(errMsg)
	case <-time.After(1500 * time.Millisecond):
		logger.Get().Infof("MOUNT", "Drive %s berhasil aktif terpasang di Windows File Explorer!", drive.DriveLetter)
	}

	s.processes[drive.ID] = &ProcessEntry{
		DriveID:     drive.ID,
		DriveLetter: drive.DriveLetter,
		Cmd:         cmd,
		StartedAt:   time.Now(),
		RcPort:      rcPort,
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

// UnmountAll terminates all active drive mount processes and cleans up configs
func (s *Supervisor) UnmountAll() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for id, entry := range s.processes {
		if entry.Cmd != nil && entry.Cmd.Process != nil {
			_ = entry.Cmd.Process.Kill()
			_ = entry.Cmd.Wait()
		}
		tempConf := filepath.Join(s.binDir, fmt.Sprintf("rclone_%s.conf", id))
		_ = os.Remove(tempConf)
	}
	s.processes = make(map[string]*ProcessEntry)
}

// TransferItem represents a single active file transfer reported by rclone RC
type TransferItem struct {
	Name           string `json:"name"`
	DriveLetter    string `json:"driveLetter"`
	Percentage     int    `json:"percentage"`
	Bytes          int64  `json:"bytes"`
	Size           int64  `json:"size"`
	Speed          int64  `json:"speed"`
	SpeedFormatted string `json:"speedFormatted"`
	BytesFormatted string `json:"bytesFormatted"`
	SizeFormatted  string `json:"sizeFormatted"`
	Eta            int64  `json:"eta"`
	EtaFormatted   string `json:"etaFormatted"`
}

// TransferStatus represents the aggregated live upload status across all mounted drives
type TransferStatus struct {
	Active         bool           `json:"active"`
	TotalSpeed     int64          `json:"totalSpeed"`
	SpeedFormatted string         `json:"speedFormatted"`
	Items          []TransferItem `json:"items"`
}

type rcloneTransferringItem struct {
	Name       string `json:"name"`
	Size       int64  `json:"size"`
	Bytes      int64  `json:"bytes"`
	Percentage int    `json:"percentage"`
	Speed      int64  `json:"speed"`
	SpeedAvg   int64  `json:"speedAvg"`
	Eta        *int64 `json:"eta"`
}

type rcloneStatsResponse struct {
	Bytes        int64                    `json:"bytes"`
	TotalBytes   int64                    `json:"totalBytes"`
	Speed        int64                    `json:"speed"`
	Transfers    int                      `json:"transfers"`
	Transferring []rcloneTransferringItem `json:"transferring"`
}

var statsClient = &http.Client{
	Timeout: 400 * time.Millisecond,
}

func formatTransferBytes(b int64) string {
	if b <= 0 {
		return "0 B"
	}
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

func formatTransferSpeed(b int64) string {
	return formatTransferBytes(b) + "/s"
}

func formatTransferEta(seconds int64) string {
	if seconds <= 0 {
		return "0s"
	}
	if seconds < 60 {
		return fmt.Sprintf("%ds", seconds)
	}
	m := seconds / 60
	s := seconds % 60
	if m < 60 {
		return fmt.Sprintf("%dm %ds", m, s)
	}
	h := m / 60
	m = m % 60
	return fmt.Sprintf("%dh %dm", h, m)
}

// GetTransferStatus queries rclone RC core/stats across all running drives
func (s *Supervisor) GetTransferStatus() TransferStatus {
	s.mu.RLock()
	type target struct {
		port   int
		letter string
	}
	var targets []target
	for _, proc := range s.processes {
		if proc.RcPort > 0 {
			targets = append(targets, target{port: proc.RcPort, letter: proc.DriveLetter})
		}
	}
	s.mu.RUnlock()

	status := TransferStatus{
		Active: false,
		Items:  make([]TransferItem, 0),
	}

	for _, tgt := range targets {
		url := fmt.Sprintf("http://127.0.0.1:%d/core/stats", tgt.port)
		resp, err := statsClient.Post(url, "application/json", strings.NewReader("{}"))
		if err != nil {
			continue
		}
		var stats rcloneStatsResponse
		err = json.NewDecoder(resp.Body).Decode(&stats)
		_ = resp.Body.Close()
		if err != nil {
			continue
		}

		status.TotalSpeed += stats.Speed
		for _, item := range stats.Transferring {
			etaSec := int64(0)
			if item.Eta != nil {
				etaSec = *item.Eta
			}
			tItem := TransferItem{
				Name:           filepath.Base(item.Name),
				DriveLetter:    tgt.letter,
				Percentage:     item.Percentage,
				Bytes:          item.Bytes,
				Size:           item.Size,
				Speed:          item.Speed,
				SpeedFormatted: formatTransferSpeed(item.Speed),
				BytesFormatted: formatTransferBytes(item.Bytes),
				SizeFormatted:  formatTransferBytes(item.Size),
				Eta:            etaSec,
				EtaFormatted:   formatTransferEta(etaSec),
			}
			status.Items = append(status.Items, tItem)
		}

		if len(stats.Transferring) == 0 && stats.Transfers > 0 && stats.Speed > 0 {
			tItem := TransferItem{
				Name:           "Menyinkronkan berkas ke Google Cloud...",
				DriveLetter:    tgt.letter,
				Percentage:     50,
				Bytes:          stats.Bytes,
				Size:           stats.TotalBytes,
				Speed:          stats.Speed,
				SpeedFormatted: formatTransferSpeed(stats.Speed),
				BytesFormatted: formatTransferBytes(stats.Bytes),
				SizeFormatted:  formatTransferBytes(stats.TotalBytes),
				Eta:            0,
				EtaFormatted:   "proses",
			}
			status.Items = append(status.Items, tItem)
		}
	}

	if len(status.Items) > 0 {
		status.Active = true
		status.SpeedFormatted = formatTransferSpeed(status.TotalSpeed)
	}

	return status
}


