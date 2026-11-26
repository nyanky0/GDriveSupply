//go:build !windows

package sysutil

import (
	"os"
	"path/filepath"
	"syscall"
)

// EnsureSingleInstance ensures only one instance of GDriveSupply runs.
// On Linux/Unix, uses flock on a lock file in the user config directory.
func EnsureSingleInstance(mutexName string, webURL string) uintptr {
	baseDir, err := os.UserConfigDir()
	if err != nil || baseDir == "" {
		baseDir = "."
	}
	appDir := filepath.Join(baseDir, "GDriveSupply")
	_ = os.MkdirAll(appDir, 0755)

	lockPath := filepath.Join(appDir, "gdrive_supply.lock")
	lockFile, err := os.OpenFile(lockPath, os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		return 0
	}

	err = syscall.Flock(int(lockFile.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
	if err != nil {
		// Already locked by another running instance
		if webURL != "" {
			_ = OpenURL(webURL)
		}
		os.Exit(0)
	}

	return uintptr(lockFile.Fd())
}
