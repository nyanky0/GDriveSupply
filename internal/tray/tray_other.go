//go:build !windows

package tray

import (
	"os"
	"os/signal"
	"syscall"

	"gdrive-supply/internal/logger"
)

// StartTray runs a background daemon loop on non-Windows platforms
func StartTray(webURL string, localToken string, onExit func(withWinFsp bool)) {
	logger.Get().Infof("TRAY", "GDrive Supply aktif di Linux (Headless/Daemon mode). Akses Web Dashboard di: %s", webURL)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Get().Infof("TRAY", "Menerima sinyal terminasi...")
	if onExit != nil {
		onExit(false)
	}
}
