package tray

import (
	_ "embed"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"syscall"

	"gdrive-supply/internal/logger"
)

//go:embed tray_helper.exe
var trayHelperExe []byte

// StartTray initializes and launches the embedded Windows System Tray helper
func StartTray(webURL string, localToken string, onExit func(withWinFsp bool)) {
	// Parse port from webURL
	port := "4040"
	if u, err := url.Parse(webURL); err == nil && u.Port() != "" {
		port = u.Port()
	}

	tempDir := os.TempDir()
	targetPath := filepath.Join(tempDir, "gdrive-supply-tray.exe")

	// Write tray_helper.exe to temp if not exists or size differs
	needWrite := true
	if fi, err := os.Stat(targetPath); err == nil {
		if fi.Size() == int64(len(trayHelperExe)) {
			needWrite = false
		}
	}

	if needWrite {
		if err := os.WriteFile(targetPath, trayHelperExe, 0755); err != nil {
			logger.Warn("Gagal menulis tray helper ke temp: %v, mencoba lokasi saat ini", err)
			targetPath = "gdrive-supply-tray.exe"
			_ = os.WriteFile(targetPath, trayHelperExe, 0755)
		}
	}

	pid := os.Getpid()
	args := []string{
		"--port", port,
		"--pid", strconv.Itoa(pid),
	}
	if localToken != "" {
		args = append(args, "--token", localToken)
	}

	cmd := exec.Command(targetPath, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
		HideWindow:    true,
	}

	if err := cmd.Start(); err != nil {
		logger.Error("Gagal menjalankan tray helper: %v", err)
		// Block forever if tray failed so app keeps serving web
		select {}
	}

	logger.Info("System Tray helper aktif (PID: %d)", cmd.Process.Pid)

	// Block until tray helper exits or app is terminated
	_ = cmd.Wait()
	logger.Info("System Tray helper telah selesai.")
	if onExit != nil {
		onExit(false)
	}
}
