//go:build !windows

package mount

import (
	"fmt"
	"os/exec"
)

// CheckWinFspInstalled checks if FUSE (fusermount or fusermount3) is installed on Linux
func CheckWinFspInstalled() bool {
	if _, err := exec.LookPath("fusermount3"); err == nil {
		return true
	}
	if _, err := exec.LookPath("fusermount"); err == nil {
		return true
	}
	return false
}

// DownloadAndLaunchWinFspInstaller provides guidance for installing FUSE on Linux
func (s *Supervisor) DownloadAndLaunchWinFspInstaller() error {
	return fmt.Errorf("pada sistem Linux, pasang FUSE melalui package manager distro Anda: 'sudo pacman -S fuse3' (Arch), 'sudo apt install fuse3' (Debian/Ubuntu), atau 'sudo dnf install fuse3' (Fedora)")
}
