package mount

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

// DownloadAndLaunchWinFspInstaller downloads and runs the official WinFsp installer
func (s *Supervisor) DownloadAndLaunchWinFspInstaller() error {
	msiPath := filepath.Join(s.binDir, "winfsp-installer.msi")

	// If installer not downloaded yet, download it
	if _, err := os.Stat(msiPath); os.IsNotExist(err) {
		downloadURL := "https://github.com/winfsp/winfsp/releases/download/v2.0/winfsp-2.0.23075.msi"
		resp, err := http.Get(downloadURL)
		if err != nil {
			return fmt.Errorf("gagal mengunduh installer WinFsp: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return fmt.Errorf("server download WinFsp mengembalikan HTTP %d", resp.StatusCode)
		}

		outFile, err := os.Create(msiPath)
		if err != nil {
			return fmt.Errorf("gagal membuat file installer: %w", err)
		}
		defer outFile.Close()

		if _, err := io.Copy(outFile, resp.Body); err != nil {
			return fmt.Errorf("gagal menulis file installer: %w", err)
		}
	}

	// Launch the MSI installer interactively so user can complete setup
	cmd := exec.Command("msiexec.exe", "/i", msiPath)
	return cmd.Start()
}
