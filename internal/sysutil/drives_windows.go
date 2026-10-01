package sysutil

import (
	"fmt"
	"os/exec"
	"strings"
	"syscall"
)

var (
	modkernel32       = syscall.NewLazyDLL("kernel32.dll")
	procGetLogicalDrives = modkernel32.NewProc("GetLogicalDrives")
)

// GetAvailableDriveLetters returns a list of free Windows drive letters (e.g. ["G:", "H:", "X:", "Y:", "Z:"])
func GetAvailableDriveLetters() []string {
	ret, _, _ := procGetLogicalDrives.Call()
	mask := uint32(ret)

	var available []string
	// Check from C (index 2) to Z (index 25)
	for i := 2; i < 26; i++ {
		letter := fmt.Sprintf("%c:", 'A'+i)
		// If bit is 0, drive letter is available
		if (mask & (1 << uint(i))) == 0 {
			available = append(available, letter)
		}
	}

	// Prefer showing letters from G onwards first if available
	return available
}

// OpenDriveInExplorer launches Windows Explorer for the given drive letter (e.g. "X:" or "X")
func OpenDriveInExplorer(driveLetter string) error {
	clean := strings.TrimSuffix(strings.ToUpper(strings.TrimSpace(driveLetter)), ":")
	target := clean + ":\\"
	cmd := exec.Command("explorer.exe", target)
	return cmd.Start()
}

// OpenURL opens the given URL in the default browser without popping up any CMD window
func OpenURL(url string) error {
	cmd := exec.Command("cmd", "/c", "start", "", url)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}
	return cmd.Start()
}
