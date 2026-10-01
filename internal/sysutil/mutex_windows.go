package sysutil

import (
	"os"
	"syscall"
	"unsafe"
)

var (
	procCreateMutexW = modkernel32.NewProc("CreateMutexW")
)

const ERROR_ALREADY_EXISTS = 183

// EnsureSingleInstance ensures only one instance of GDriveManager runs.
// If another instance is running, it opens the existing web dashboard in the browser and exits.
func EnsureSingleInstance(mutexName string, webURL string) uintptr {
	namePtr, _ := syscall.UTF16PtrFromString(mutexName)
	hMutex, _, err := procCreateMutexW.Call(
		0,
		1, // Initial owner: true
		uintptr(unsafe.Pointer(namePtr)),
	)

	// Check if already exists
	if errno, ok := err.(syscall.Errno); ok && errno == ERROR_ALREADY_EXISTS {
		// Open the web browser to the already-running instance without popping a CMD window
		if webURL != "" {
			_ = OpenURL(webURL)
		}
		os.Exit(0)
	}

	return hMutex
}
