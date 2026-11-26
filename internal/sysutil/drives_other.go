//go:build !windows

package sysutil

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// GetAvailableDriveLetters returns virtual drive slots on non-Windows systems
func GetAvailableDriveLetters() []string {
	var slots []string
	letters := []string{"D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"}
	for _, l := range letters {
		slots = append(slots, fmt.Sprintf("%s:", l))
	}
	return slots
}

// GetMountPathForLetter returns the local mount folder on Linux
func GetMountPathForLetter(driveLetter string) string {
	clean := strings.TrimSuffix(strings.ToUpper(strings.TrimSpace(driveLetter)), ":")
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		home = "."
	}
	return filepath.Join(home, "GDrive", clean)
}

// OpenDriveInExplorer launches default file manager (xdg-open) for the drive mount folder
func OpenDriveInExplorer(driveLetter string) error {
	target := GetMountPathForLetter(driveLetter)
	_ = os.MkdirAll(target, 0755)
	cmd := exec.Command("xdg-open", target)
	return cmd.Start()
}

// OpenURL opens the given URL in the default browser using xdg-open
func OpenURL(url string) error {
	cmd := exec.Command("xdg-open", url)
	return cmd.Start()
}
