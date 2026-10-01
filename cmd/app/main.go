package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"strings"
	"syscall"
	"time"

	"gdrive-supply/internal/api"
	"gdrive-supply/internal/config"
	"gdrive-supply/internal/logger"
	"gdrive-supply/internal/mount"
	"gdrive-supply/internal/sysutil"
	"gdrive-supply/internal/tray"
	"gdrive-supply/internal/ui"
)

func main() {
	// Initialize central high-capacity logging engine
	l := logger.InitLogger()
	l.Infof("CORE", "Memulai GDrive Supply (v2.2 Production Edition)...")
	l.Infof("CORE", "File log tersimpan di: %s", l.GetLogFilePath())

	serverAddr := "127.0.0.1:4040"
	webURL := fmt.Sprintf("http://%s", serverAddr)

	// Ensure only 1 instance of GDriveSupply runs
	sysutil.EnsureSingleInstance("Local\\GDriveSupply_SingleInstance_Mutex", webURL)

	l.Infof("CORE", "========================================================")
	l.Infof("CORE", " GDrive Supply - Multi-Account Local Drive Service      ")
	l.Infof("CORE", "========================================================")

	// Check WinFsp on startup
	if !mount.CheckWinFspInstalled() {
		l.Warnf("CORE", "PERINGATAN: Driver WinFsp belum terpasang. Partisi drive tidak dapat dimount tanpa WinFsp.")
	} else {
		l.Infof("CORE", "Driver WinFsp terdeteksi aktif dan siap digunakan.")
	}

	store := config.GetStore()
	supervisor := mount.GetSupervisor()

	// Auto-mount active drives on startup
	clientID, clientSecret, _ := store.GetCredentials()
	if clientID != "" && clientSecret != "" {
		drives := store.GetAllDrives()
		for _, d := range drives {
			if d.Status == "mounted" {
				refreshToken, err := config.DecryptString(d.RefreshTokenEnc)
				if err == nil {
					log.Printf("Auto-mounting drive %s (%s)...", d.DriveLetter, d.Email)
					go func(drive *config.DriveConfig, token string) {
						err := supervisor.MountDrive(drive, clientID, clientSecret, token)
						if err != nil {
							log.Printf("Gagal auto-mount drive %s: %v", drive.DriveLetter, err)
							drive.Status = "error"
							drive.ErrorMessage = err.Error()
							_ = store.SaveDrive(drive)
						}
					}(d, refreshToken)
				}
			}
		}
	}

	mux := http.NewServeMux()

	// Register API endpoints
	apiHandler := api.NewAPI(store, supervisor)
	apiHandler.RegisterRoutes(mux)

	// Serve embedded frontend
	distFS, err := ui.GetFS()
	if err != nil {
		log.Fatalf("Gagal memuat embedded frontend: %v", err)
	}

	fileServer := http.FileServer(http.FS(distFS))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If it's an API route, do not serve static
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Try open file from embedded FS
		cleanedPath := path.Clean(strings.TrimPrefix(r.URL.Path, "/"))
		if cleanedPath == "." || cleanedPath == "" {
			cleanedPath = "index.html"
		}

		if f, err := distFS.Open(cleanedPath); err == nil {
			_ = f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}

		// SPA fallback to index.html
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})

	server := &http.Server{
		Addr:    serverAddr,
		Handler: mux,
	}

	shutdownFunc := func(withWinFsp bool) {
		log.Println("\nMematikan GDrive Supply...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Unmount all running drives cleanly
		for _, d := range store.GetAllDrives() {
			if supervisor.IsMounted(d.ID) {
				log.Printf("Melepas drive %s...", d.DriveLetter)
				_ = supervisor.UnmountDrive(d.ID)
			}
		}

		if withWinFsp {
			log.Println("Menghentikan layanan WinFsp di latar belakang...")
			_ = exec.Command("net", "stop", "WinFsp.Launcher").Run()
		}

		_ = server.Shutdown(ctx)
		log.Println("Selesai. Sampai jumpa!")
		os.Exit(0)
	}

	// Listen for SIGINT / SIGTERM
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		shutdownFunc(false)
	}()

	// Start HTTP Server
	go func() {
		log.Printf("Web Dashboard aktif di: %s\n", webURL)
		// Auto open browser on initial start without flashing CMD
		time.Sleep(600 * time.Millisecond)
		_ = sysutil.OpenURL(webURL)

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// Run native Windows System Tray on main thread
	tray.StartTray(webURL, shutdownFunc)
}
