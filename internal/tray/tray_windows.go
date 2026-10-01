package tray

import (
	"os/exec"
	"syscall"
	"unsafe"
)

var (
	modkernel32          = syscall.NewLazyDLL("kernel32.dll")
	moduser32            = syscall.NewLazyDLL("user32.dll")
	modshell32           = syscall.NewLazyDLL("shell32.dll")
	procGetModuleHandleW = modkernel32.NewProc("GetModuleHandleW")
	procRegisterClassExW = moduser32.NewProc("RegisterClassExW")
	procCreateWindowExW  = moduser32.NewProc("CreateWindowExW")
	procDefWindowProcW   = moduser32.NewProc("DefWindowProcW")
	procGetMessageW      = moduser32.NewProc("GetMessageW")
	procTranslateMessage = moduser32.NewProc("TranslateMessage")
	procDispatchMessageW = moduser32.NewProc("DispatchMessageW")
	procPostQuitMessage  = moduser32.NewProc("PostQuitMessage")
	procCreatePopupMenu  = moduser32.NewProc("CreatePopupMenu")
	procAppendMenuW      = moduser32.NewProc("AppendMenuW")
	procTrackPopupMenu   = moduser32.NewProc("TrackPopupMenu")
	procGetCursorPos     = moduser32.NewProc("GetCursorPos")
	procSetForeground    = moduser32.NewProc("SetForegroundWindow")
	procLoadIconW        = moduser32.NewProc("LoadIconW")
	procShellNotifyIconW = modshell32.NewProc("Shell_NotifyIconW")
)

const (
	WM_USER          = 0x0400
	WM_TRAYICON      = WM_USER + 1
	WM_COMMAND       = 0x0111
	WM_RBUTTONUP     = 0x0205
	WM_LBUTTONDBLCLK = 0x0203

	NIM_ADD     = 0x00000000
	NIM_DELETE  = 0x00000002
	NIF_MESSAGE = 0x00000001
	NIF_ICON    = 0x00000002
	NIF_TIP     = 0x00000004

	MF_STRING    = 0x00000000
	MF_SEPARATOR = 0x00000800

	TPM_BOTTOMALIGN = 0x0020
	TPM_LEFTALIGN   = 0x0000

	ID_OPEN_WEB         = 1001
	ID_OPEN_EXPLORER    = 1002
	ID_EXIT_APP_ONLY    = 1003
	ID_EXIT_WITH_WINFSP = 1004
)

type notifyIconData struct {
	cbSize           uint32
	hWnd             syscall.Handle
	uID              uint32
	uFlags           uint32
	uCallbackMessage uint32
	hIcon            syscall.Handle
	szTip            [128]uint16
}

type point struct {
	X int32
	Y int32
}

type wndClassEx struct {
	cbSize        uint32
	style         uint32
	lpfnWndProc   uintptr
	cbClsExtra    int32
	cbWndExtra    int32
	hInstance     syscall.Handle
	hIcon         syscall.Handle
	hCursor       syscall.Handle
	hbrBackground syscall.Handle
	lpszMenuName  *uint16
	lpszClassName *uint16
	hIconSm       syscall.Handle
}

type msg struct {
	hwnd    syscall.Handle
	message uint32
	wParam  uintptr
	lParam  uintptr
	time    uint32
	pt      point
}

// StartTray initializes a native Windows System Tray icon
func StartTray(webURL string, onExit func(withWinFsp bool)) {
	className, _ := syscall.UTF16PtrFromString("GDriveSupplyTrayClass")
	windowTitle, _ := syscall.UTF16PtrFromString("GDriveSupplyTrayWindow")

	hInst, _, _ := procGetModuleHandleW.Call(0)
	hInstance := syscall.Handle(hInst)

	// Standard application icon from Windows
	hIcon, _, _ := procLoadIconW.Call(0, uintptr(32512)) // IDI_APPLICATION

	var hwnd syscall.Handle
	var nid notifyIconData

	wndProc := syscall.NewCallback(func(h syscall.Handle, message uint32, wParam, lParam uintptr) uintptr {
		switch message {
		case WM_TRAYICON:
			if lParam == WM_RBUTTONUP {
				// Show Context Menu on right click
				var pt point
				procGetCursorPos.Call(uintptr(unsafe.Pointer(&pt)))
				hMenu, _, _ := procCreatePopupMenu.Call()

				menuOpenWeb, _ := syscall.UTF16PtrFromString("🌐 Buka Web Dashboard")
				menuOpenExp, _ := syscall.UTF16PtrFromString("📁 Buka File Explorer")
				menuExitApp, _ := syscall.UTF16PtrFromString("❌ Matikan GDrive Supply Saja")
				menuExitAll, _ := syscall.UTF16PtrFromString("🛑 Matikan App + WinFsp Service")

				procAppendMenuW.Call(hMenu, uintptr(MF_STRING), uintptr(ID_OPEN_WEB), uintptr(unsafe.Pointer(menuOpenWeb)))
				procAppendMenuW.Call(hMenu, uintptr(MF_STRING), uintptr(ID_OPEN_EXPLORER), uintptr(unsafe.Pointer(menuOpenExp)))
				procAppendMenuW.Call(hMenu, uintptr(MF_SEPARATOR), 0, 0)
				procAppendMenuW.Call(hMenu, uintptr(MF_STRING), uintptr(ID_EXIT_APP_ONLY), uintptr(unsafe.Pointer(menuExitApp)))
				procAppendMenuW.Call(hMenu, uintptr(MF_STRING), uintptr(ID_EXIT_WITH_WINFSP), uintptr(unsafe.Pointer(menuExitAll)))

				procSetForeground.Call(uintptr(h))
				procTrackPopupMenu.Call(hMenu, uintptr(TPM_BOTTOMALIGN|TPM_LEFTALIGN), uintptr(pt.X), uintptr(pt.Y), 0, uintptr(h), 0)
				return 0
			} else if lParam == WM_LBUTTONDBLCLK {
				// Open web dashboard on double-click
				_ = exec.Command("cmd", "/c", "start", webURL).Start()
				return 0
			}

		case WM_COMMAND:
			switch wParam {
			case ID_OPEN_WEB:
				_ = exec.Command("cmd", "/c", "start", webURL).Start()
			case ID_OPEN_EXPLORER:
				_ = exec.Command("explorer.exe").Start()
			case ID_EXIT_APP_ONLY:
				procShellNotifyIconW.Call(uintptr(NIM_DELETE), uintptr(unsafe.Pointer(&nid)))
				if onExit != nil {
					onExit(false)
				}
				procPostQuitMessage.Call(0)
			case ID_EXIT_WITH_WINFSP:
				procShellNotifyIconW.Call(uintptr(NIM_DELETE), uintptr(unsafe.Pointer(&nid)))
				if onExit != nil {
					onExit(true)
				}
				procPostQuitMessage.Call(0)
			}
			return 0
		}

		ret, _, _ := procDefWindowProcW.Call(uintptr(h), uintptr(message), wParam, lParam)
		return ret
	})

	var wc wndClassEx
	wc.cbSize = uint32(unsafe.Sizeof(wc))
	wc.lpfnWndProc = wndProc
	wc.hInstance = hInstance
	wc.lpszClassName = className
	wc.hIcon = syscall.Handle(hIcon)
	procRegisterClassExW.Call(uintptr(unsafe.Pointer(&wc)))

	hWindow, _, _ := procCreateWindowExW.Call(
		0,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(windowTitle)),
		0,
		0, 0, 0, 0,
		0, 0, hInst, 0,
	)
	hwnd = syscall.Handle(hWindow)

	// Setup NotifyIconData
	nid.cbSize = uint32(unsafe.Sizeof(nid))
	nid.hWnd = hwnd
	nid.uID = 1
	nid.uFlags = NIF_MESSAGE | NIF_ICON | NIF_TIP
	nid.uCallbackMessage = WM_TRAYICON
	nid.hIcon = syscall.Handle(hIcon)
	tipChars, _ := syscall.UTF16FromString("GDrive Supply (Aktif)")
	copy(nid.szTip[:], tipChars)

	// Add icon to system tray
	procShellNotifyIconW.Call(uintptr(NIM_ADD), uintptr(unsafe.Pointer(&nid)))

	// Run Windows Message Loop
	var m msg
	for {
		r, _, _ := procGetMessageW.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if r == 0 || int32(r) == -1 {
			break
		}
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&m)))
	}
}
