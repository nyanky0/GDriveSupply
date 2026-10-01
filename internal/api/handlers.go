package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"gdrive-supply/internal/config"
	"gdrive-supply/internal/mount"
	"gdrive-supply/internal/sysutil"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

type API struct {
	store      *config.Store
	supervisor *mount.Supervisor
}

func NewAPI(store *config.Store, supervisor *mount.Supervisor) *API {
	return &API{
		store:      store,
		supervisor: supervisor,
	}
}

// RegisterRoutes registers all API endpoints to an http.ServeMux
func (a *API) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/status", a.HandleStatus)
	mux.HandleFunc("POST /api/config/credentials", a.HandleSaveCredentials)
	mux.HandleFunc("GET /api/auth/start", a.HandleAuthStart)
	mux.HandleFunc("GET /api/auth/callback", a.HandleAuthCallback)
	mux.HandleFunc("POST /api/drives/mount/", a.HandleMountDrive)
	mux.HandleFunc("POST /api/drives/unmount/", a.HandleUnmountDrive)
	mux.HandleFunc("POST /api/drives/rename", a.HandleRenameDrive)
	mux.HandleFunc("DELETE /api/drives/", a.HandleDeleteDrive)
	mux.HandleFunc("POST /api/drives/open/", a.HandleOpenExplorer)
	mux.HandleFunc("POST /api/winfsp/install", a.HandleInstallWinFsp)
	mux.HandleFunc("POST /api/system/shutdown", a.HandleShutdown)
}


func (a *API) HandleStatus(w http.ResponseWriter, r *http.Request) {
	drives := a.store.GetAllDrives()
	var totalStorage, usedStorage int64
	activeCount := 0

	for _, d := range drives {
		// Sync live status with supervisor
		if a.supervisor.IsMounted(d.ID) {
			d.Status = "mounted"
			activeCount++
		} else if d.Status == "mounted" {
			d.Status = "unmounted"
		}
		totalStorage += d.TotalStorage
		usedStorage += d.UsedStorage
	}

	freeStorage := totalStorage - usedStorage
	if freeStorage < 0 {
		freeStorage = 0
	}

	clientID, clientSecret, _ := a.store.GetCredentials()
	availableLetters := sysutil.GetAvailableDriveLetters()

	resp := map[string]interface{}{
		"systemStatus": map[string]interface{}{
			"totalStorage":      totalStorage,
			"usedStorage":       usedStorage,
			"freeStorage":       freeStorage,
			"activeDrivesCount": activeCount,
			"availableLetters":  availableLetters,
			"winfspInstalled":   mount.CheckWinFspInstalled(),
		},

		"drives": drives,
		"credentials": map[string]interface{}{
			"configured":   clientID != "" && clientSecret != "",
			"clientId":     clientID,
			"clientSecret": clientSecret,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (a *API) HandleSaveCredentials(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ClientID     string `json:"clientId"`
		ClientSecret string `json:"clientSecret"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if req.ClientID == "" || req.ClientSecret == "" {
		http.Error(w, `{"error":"clientId and clientSecret are required"}`, http.StatusBadRequest)
		return
	}

	if err := a.store.SetCredentials(req.ClientID, req.ClientSecret); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to save credentials: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}

func (a *API) HandleAuthStart(w http.ResponseWriter, r *http.Request) {
	clientID, clientSecret, err := a.store.GetCredentials()
	if err != nil || clientID == "" || clientSecret == "" {
		http.Redirect(w, r, "/?auth=error&message=Kredensial+Google+OAuth+belum+diatur", http.StatusTemporaryRedirect)
		return
	}

	letter := r.URL.Query().Get("letter")
	if letter == "" {
		letter = "X:"
	}
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "Google Drive"
	}

	redirectURL := fmt.Sprintf("http://%s/api/auth/callback", r.Host)
	oauthConf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
		RedirectURL:  redirectURL,
		Scopes: []string{
			drive.DriveScope,
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
	}

	statePayload := fmt.Sprintf("%s|%s", letter, name)
	authURL := oauthConf.AuthCodeURL(
		statePayload,
		oauth2.AccessTypeOffline,
		oauth2.ApprovalForce,
	)

	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

func (a *API) HandleAuthCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Redirect(w, r, "/?auth=error&message=Kode+otorisasi+Google+kosong", http.StatusTemporaryRedirect)
		return
	}

	state := r.URL.Query().Get("state")
	parts := strings.Split(state, "|")
	targetLetter := "X:"
	accountName := "Google Drive"
	if len(parts) >= 1 && parts[0] != "" {
		targetLetter = parts[0]
	}
	if len(parts) >= 2 && parts[1] != "" {
		accountName = parts[1]
	}

	clientID, clientSecret, err := a.store.GetCredentials()
	if err != nil || clientID == "" {
		http.Redirect(w, r, "/?auth=error&message=Kredensial+hilang", http.StatusTemporaryRedirect)
		return
	}

	redirectURL := fmt.Sprintf("http://%s/api/auth/callback", r.Host)
	oauthConf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
		RedirectURL:  redirectURL,
		Scopes: []string{
			drive.DriveScope,
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
	}

	ctx := context.Background()
	token, err := oauthConf.Exchange(ctx, code)
	if err != nil {
		http.Redirect(w, r, fmt.Sprintf("/?auth=error&message=Gagal+tukar+token:+%s", err.Error()), http.StatusTemporaryRedirect)
		return
	}

	if token.RefreshToken == "" {
		http.Redirect(w, r, "/?auth=error&message=Google+tidak+mengirim+refresh_token.+Coba+hapus+izin+aplikasi+di+Google+Security+dan+login+ulang.", http.StatusTemporaryRedirect)
		return
	}

	// Fetch user & storage details from Google Drive API
	client := oauthConf.Client(ctx, token)
	driveService, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		http.Redirect(w, r, fmt.Sprintf("/?auth=error&message=Gagal+konek+Drive+API:+%s", err.Error()), http.StatusTemporaryRedirect)
		return
	}

	about, err := driveService.About.Get().Fields("user(emailAddress,displayName),storageQuota(limit,usage)").Do()
	email := "unknown@gmail.com"
	var totalStorage, usedStorage int64 = 16106127360, 0 // Default 15 GB
	if err == nil && about != nil {
		if about.User != nil && about.User.EmailAddress != "" {
			email = about.User.EmailAddress
		}
		if about.StorageQuota != nil {
			totalStorage = about.StorageQuota.Limit
			usedStorage = about.StorageQuota.Usage
		}
	}

	encRefresh, err := config.EncryptString(token.RefreshToken)
	if err != nil {
		http.Redirect(w, r, "/?auth=error&message=Gagal+enkripsi+token", http.StatusTemporaryRedirect)
		return
	}

	driveID := fmt.Sprintf("drive_%d", time.Now().UnixNano())
	driveCfg := &config.DriveConfig{
		ID:              driveID,
		Email:           email,
		AccountName:     accountName,
		DriveLetter:     targetLetter,
		RefreshTokenEnc: encRefresh,
		TotalStorage:    totalStorage,
		UsedStorage:     usedStorage,
		Status:          "mounted",
		ConnectedAt:     time.Now(),
		LastSynced:      time.Now(),
	}

	_ = a.store.SaveDrive(driveCfg)

	// Launch rclone mount
	go func() {
		err := a.supervisor.MountDrive(driveCfg, clientID, clientSecret, token.RefreshToken)
		if err != nil {
			driveCfg.Status = "error"
			driveCfg.ErrorMessage = err.Error()
			_ = a.store.SaveDrive(driveCfg)
		}
	}()

	http.Redirect(w, r, "/?auth=success", http.StatusTemporaryRedirect)
}

func (a *API) HandleMountDrive(w http.ResponseWriter, r *http.Request) {
	driveID := strings.TrimPrefix(r.URL.Path, "/api/drives/mount/")
	driveCfg, ok := a.store.GetDrive(driveID)
	if !ok {
		http.Error(w, `{"error":"drive not found"}`, http.StatusNotFound)
		return
	}

	clientID, clientSecret, err := a.store.GetCredentials()
	if err != nil || clientID == "" {
		http.Error(w, `{"error":"credentials not configured"}`, http.StatusBadRequest)
		return
	}

	refreshToken, err := config.DecryptString(driveCfg.RefreshTokenEnc)
	if err != nil {
		http.Error(w, `{"error":"failed to decrypt token"}`, http.StatusInternalServerError)
		return
	}

	err = a.supervisor.MountDrive(driveCfg, clientID, clientSecret, refreshToken)
	if err != nil {
		driveCfg.Status = "error"
		driveCfg.ErrorMessage = err.Error()
		_ = a.store.SaveDrive(driveCfg)
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	driveCfg.Status = "mounted"
	driveCfg.ErrorMessage = ""
	_ = a.store.SaveDrive(driveCfg)

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"mounted"}`))
}

func (a *API) HandleUnmountDrive(w http.ResponseWriter, r *http.Request) {
	driveID := strings.TrimPrefix(r.URL.Path, "/api/drives/unmount/")
	driveCfg, ok := a.store.GetDrive(driveID)
	if !ok {
		http.Error(w, `{"error":"drive not found"}`, http.StatusNotFound)
		return
	}

	_ = a.supervisor.UnmountDrive(driveID)
	driveCfg.Status = "unmounted"
	_ = a.store.SaveDrive(driveCfg)

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"unmounted"}`))
}

func (a *API) HandleDeleteDrive(w http.ResponseWriter, r *http.Request) {
	driveID := strings.TrimPrefix(r.URL.Path, "/api/drives/")
	_ = a.supervisor.UnmountDrive(driveID)
	_ = a.store.DeleteDrive(driveID)

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"deleted"}`))
}

func (a *API) HandleOpenExplorer(w http.ResponseWriter, r *http.Request) {
	letter := strings.TrimPrefix(r.URL.Path, "/api/drives/open/")
	if letter == "" {
		http.Error(w, `{"error":"letter required"}`, http.StatusBadRequest)
		return
	}

	_ = sysutil.OpenDriveInExplorer(letter)
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"opened"}`))
}

func (a *API) HandleInstallWinFsp(w http.ResponseWriter, r *http.Request) {
	err := a.supervisor.DownloadAndLaunchWinFspInstaller()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"installer_launched"}`))
}

type RenameRequest struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (a *API) HandleRenameDrive(w http.ResponseWriter, r *http.Request) {
	var req RenameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == "" {
		http.Error(w, `{"error":"ID drive diperlukan"}`, http.StatusBadRequest)
		return
	}

	driveCfg, ok := a.store.GetDrive(req.ID)
	if !ok {
		http.Error(w, `{"error":"drive tidak ditemukan"}`, http.StatusNotFound)
		return
	}

	cleanedName := strings.TrimSpace(req.Name)
	if cleanedName == "" {
		cleanedName = fmt.Sprintf("GDrive_%s", strings.TrimSuffix(driveCfg.DriveLetter, ":"))
	}

	driveCfg.VolumeLabel = cleanedName
	driveCfg.AccountName = cleanedName
	_ = a.store.SaveDrive(driveCfg)

	// If currently mounted, unmount & remount instantly so Windows File Explorer reflects the new volume label immediately
	if a.supervisor.IsMounted(driveCfg.ID) {
		_ = a.supervisor.UnmountDrive(driveCfg.ID)
		clientID, clientSecret, _ := a.store.GetCredentials()
		refreshToken, err := config.DecryptString(driveCfg.RefreshTokenEnc)
		if err == nil && clientID != "" {
			err = a.supervisor.MountDrive(driveCfg, clientID, clientSecret, refreshToken)
			if err == nil {
				driveCfg.Status = "mounted"
				driveCfg.ErrorMessage = ""
			} else {
				driveCfg.Status = "error"
				driveCfg.ErrorMessage = err.Error()
			}
			_ = a.store.SaveDrive(driveCfg)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(driveCfg)
}

type ShutdownRequest struct {
	WithWinFsp bool `json:"withWinFsp"`
}

func (a *API) HandleShutdown(w http.ResponseWriter, r *http.Request) {
	var req ShutdownRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	// Unmount all mounted drives cleanly
	drives := a.store.GetAllDrives()
	for _, d := range drives {
		if a.supervisor.IsMounted(d.ID) {
			_ = a.supervisor.UnmountDrive(d.ID)
		}
	}

	if req.WithWinFsp {
		// Stop WinFsp Launcher service in background
		go func() {
			_ = exec.Command("net", "stop", "WinFsp.Launcher").Run()
		}()
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"shutting_down"}`))

	// Exit process after short delay so HTTP client receives 200 OK
	go func() {
		time.Sleep(500 * time.Millisecond)
		os.Exit(0)
	}()
}


