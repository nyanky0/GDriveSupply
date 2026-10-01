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

func setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "gdrive_session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   86400 * 30, // 30 days
	})
}

func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "gdrive_session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})
}

func (a *API) withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("gdrive_session")
		var token string
		if err == nil {
			token = cookie.Value
		}

		enabled, _, authenticated, _ := a.store.GetSecurityStatus(token)
		if enabled && !authenticated {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"error":        "unauthorized",
				"authRequired": true,
			})
			return
		}
		next(w, r)
	}
}

// RegisterRoutes registers all API endpoints to an http.ServeMux
func (a *API) RegisterRoutes(mux *http.ServeMux) {
	// Public Auth endpoints
	mux.HandleFunc("GET /api/auth/status", a.HandleAuthStatus)
	mux.HandleFunc("POST /api/auth/login", a.HandleAuthLogin)
	mux.HandleFunc("POST /api/auth/setup", a.HandleAuthSetup)
	mux.HandleFunc("POST /api/auth/logout", a.HandleAuthLogout)

	// Protected Endpoints
	mux.HandleFunc("POST /api/auth/change-password", a.withAuth(a.HandleChangePassword))
	mux.HandleFunc("POST /api/auth/toggle", a.withAuth(a.HandleTogglePassword))
	mux.HandleFunc("GET /api/status", a.withAuth(a.HandleStatus))
	mux.HandleFunc("POST /api/config/credentials", a.withAuth(a.HandleSaveCredentials))
	mux.HandleFunc("GET /api/auth/start", a.withAuth(a.HandleAuthStart))
	mux.HandleFunc("GET /api/auth/callback", a.HandleAuthCallback)
	mux.HandleFunc("POST /api/drives/mount/", a.withAuth(a.HandleMountDrive))
	mux.HandleFunc("POST /api/drives/unmount/", a.withAuth(a.HandleUnmountDrive))
	mux.HandleFunc("POST /api/drives/rename", a.withAuth(a.HandleRenameDrive))
	mux.HandleFunc("DELETE /api/drives/", a.withAuth(a.HandleDeleteDrive))
	mux.HandleFunc("POST /api/drives/open/", a.withAuth(a.HandleOpenExplorer))
	mux.HandleFunc("POST /api/winfsp/install", a.withAuth(a.HandleInstallWinFsp))
	mux.HandleFunc("POST /api/system/shutdown", a.withAuth(a.HandleShutdown))
}

func (a *API) HandleAuthStatus(w http.ResponseWriter, r *http.Request) {
	cookie, _ := r.Cookie("gdrive_session")
	var token string
	if cookie != nil {
		token = cookie.Value
	}

	enabled, configured, authenticated, failedAttempts := a.store.GetSecurityStatus(token)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"passwordEnabled":    enabled,
		"passwordConfigured": configured,
		"authenticated":      authenticated,
		"failedAttempts":     failedAttempts,
		"maxAttempts":        5,
		"remainingAttempts":  5 - failedAttempts,
	})
}

func (a *API) HandleAuthLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	authOk, token, failedAttempts, factoryReset, _ := a.store.VerifyMasterPassword(req.Password)
	if factoryReset {
		a.supervisor.UnmountAll()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":       "factory_reset",
			"message":      "5 kali salah password berturut-turut. Seluruh pengaturan dan koneksi drive telah dihapus demi keamanan.",
			"authRequired": false,
		})
		return
	}

	if !authOk {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":            "error",
			"message":           fmt.Sprintf("Password salah. Percobaan tersisa: %d dari 5.", 5-failedAttempts),
			"failedAttempts":    failedAttempts,
			"remainingAttempts": 5 - failedAttempts,
		})
		return
	}

	setSessionCookie(w, token)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        "ok",
		"authenticated": true,
		"message":       "Berhasil masuk",
	})
}

func (a *API) HandleAuthSetup(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Password        string `json:"password"`
		ConfirmPassword string `json:"confirmPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if req.Password != req.ConfirmPassword {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Konfirmasi password baru tidak cocok"})
		return
	}

	token, err := a.store.SetMasterPassword(req.Password)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	setSessionCookie(w, token)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        "ok",
		"authenticated": true,
		"message":       "Password master berhasil dibuat",
	})
}

func (a *API) HandleChangePassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		OldPassword     string `json:"oldPassword"`
		NewPassword     string `json:"newPassword"`
		ConfirmPassword string `json:"confirmPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Konfirmasi password baru tidak cocok"})
		return
	}

	token, factoryReset, err := a.store.ChangeMasterPassword(req.OldPassword, req.NewPassword)
	if factoryReset {
		a.supervisor.UnmountAll()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "factory_reset",
			"message": "5 kali salah password berturut-turut. Aplikasi di-reset ke kondisi awal.",
		})
		return
	}
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	setSessionCookie(w, token)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"message": "Password berhasil diperbarui",
	})
}

func (a *API) HandleTogglePassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Enabled         bool   `json:"enabled"`
		Password        string `json:"password,omitempty"`
		ConfirmPassword string `json:"confirmPassword,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	if !req.Enabled {
		// Nonaktifkan & hapus hash password dari disk!
		if err := a.store.DisablePassword(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		clearSessionCookie(w)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":          "ok",
			"passwordEnabled": false,
			"message":         "Proteksi password dinonaktifkan. Data password telah dihapus dari sistem.",
		})
		return
	}

	// Mengaktifkan: Wajib input password baru & konfirmasi
	if req.Password != req.ConfirmPassword {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Konfirmasi password tidak cocok"})
		return
	}

	token, err := a.store.SetMasterPassword(req.Password)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	setSessionCookie(w, token)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "ok",
		"passwordEnabled": true,
		"message":         "Proteksi password master berhasil diaktifkan",
	})
}

func (a *API) HandleAuthLogout(w http.ResponseWriter, r *http.Request) {
	_ = a.store.InvalidateSession()
	clearSessionCookie(w)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok", "message": "Berhasil keluar"})
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

	cookie, _ := r.Cookie("gdrive_session")
	var token string
	if cookie != nil {
		token = cookie.Value
	}
	pwEnabled, _, _, _ := a.store.GetSecurityStatus(token)

	resp := map[string]interface{}{
		"systemStatus": map[string]interface{}{
			"totalStorage":      totalStorage,
			"usedStorage":       usedStorage,
			"freeStorage":       freeStorage,
			"activeDrivesCount": activeCount,
			"availableLetters":  availableLetters,
			"winfspInstalled":   mount.CheckWinFspInstalled(),
			"passwordEnabled":   pwEnabled,
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
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/drive",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
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
	state := r.URL.Query().Get("state")
	errParam := r.URL.Query().Get("error")

	if errParam != "" {
		http.Redirect(w, r, fmt.Sprintf("/?auth=error&message=%s", errParam), http.StatusTemporaryRedirect)
		return
	}

	if code == "" {
		http.Redirect(w, r, "/?auth=error&message=No+code+provided", http.StatusTemporaryRedirect)
		return
	}

	letter := "X:"
	volumeLabel := "Google Drive"
	parts := strings.Split(state, "|")
	if len(parts) >= 1 && parts[0] != "" {
		letter = parts[0]
	}
	if len(parts) >= 2 && parts[1] != "" {
		volumeLabel = parts[1]
	}

	clientID, clientSecret, err := a.store.GetCredentials()
	if err != nil || clientID == "" || clientSecret == "" {
		http.Redirect(w, r, "/?auth=error&message=Kredensial+hilang", http.StatusTemporaryRedirect)
		return
	}

	redirectURL := fmt.Sprintf("http://%s/api/auth/callback", r.Host)
	oauthConf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/drive",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	tok, err := oauthConf.Exchange(context.Background(), code)
	if err != nil {
		http.Redirect(w, r, fmt.Sprintf("/?auth=error&message=Exchange+failed:+%s", err.Error()), http.StatusTemporaryRedirect)
		return
	}

	if tok.RefreshToken == "" {
		http.Redirect(w, r, "/?auth=error&message=No+refresh+token+received", http.StatusTemporaryRedirect)
		return
	}

	// Fetch User info & Drive quota
	client := oauthConf.Client(context.Background(), tok)
	srv, err := drive.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		http.Redirect(w, r, fmt.Sprintf("/?auth=error&message=Drive+service+failed:+%s", err.Error()), http.StatusTemporaryRedirect)
		return
	}

	about, err := srv.About.Get().Fields("user(displayName,emailAddress,permissionId),storageQuota").Do()
	if err != nil {
		http.Redirect(w, r, fmt.Sprintf("/?auth=error&message=About+failed:+%s", err.Error()), http.StatusTemporaryRedirect)
		return
	}

	email := about.User.EmailAddress
	accountName := about.User.DisplayName
	if accountName == "" {
		accountName = email
	}
	userID := about.User.PermissionId
	if userID == "" {
		userID = email
	}

	totalStorage := about.StorageQuota.Limit
	usedStorage := about.StorageQuota.UsageInDrive + about.StorageQuota.UsageInDriveTrash

	encRefresh, err := config.EncryptString(tok.RefreshToken)
	if err != nil {
		http.Redirect(w, r, fmt.Sprintf("/?auth=error&message=Encryption+failed:+%s", err.Error()), http.StatusTemporaryRedirect)
		return
	}

	driveCfg := &config.DriveConfig{
		ID:              userID,
		Email:           email,
		AccountName:     accountName,
		VolumeLabel:     volumeLabel,
		DriveLetter:     letter,
		RefreshTokenEnc: encRefresh,
		TotalStorage:    totalStorage,
		UsedStorage:     usedStorage,
		Status:          "unmounted",
		ConnectedAt:     time.Now(),
		LastSynced:      time.Now(),
	}

	if err := a.store.SaveDrive(driveCfg); err != nil {
		http.Redirect(w, r, fmt.Sprintf("/?auth=error&message=Save+failed:+%s", err.Error()), http.StatusTemporaryRedirect)
		return
	}

	// Auto-mount immediately
	mountErr := a.supervisor.MountDrive(driveCfg, clientID, clientSecret, tok.RefreshToken)
	if mountErr == nil {
		driveCfg.Status = "mounted"
		driveCfg.ErrorMessage = ""
	} else {
		driveCfg.Status = "error"
		driveCfg.ErrorMessage = mountErr.Error()
	}
	_ = a.store.SaveDrive(driveCfg)

	http.Redirect(w, r, "/?auth=success", http.StatusTemporaryRedirect)
}

func (a *API) HandleMountDrive(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/drives/mount/")
	driveCfg, ok := a.store.GetDrive(id)
	if !ok {
		http.Error(w, "Drive not found", http.StatusNotFound)
		return
	}

	clientID, clientSecret, err := a.store.GetCredentials()
	if err != nil || clientID == "" || clientSecret == "" {
		http.Error(w, "Kredensial belum dikonfigurasi", http.StatusBadRequest)
		return
	}

	refreshToken, err := config.DecryptString(driveCfg.RefreshTokenEnc)
	if err != nil {
		http.Error(w, "Gagal dekripsi token", http.StatusInternalServerError)
		return
	}

	mountErr := a.supervisor.MountDrive(driveCfg, clientID, clientSecret, refreshToken)
	if mountErr != nil {
		driveCfg.Status = "error"
		driveCfg.ErrorMessage = mountErr.Error()
		_ = a.store.SaveDrive(driveCfg)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": mountErr.Error()})
		return
	}

	driveCfg.Status = "mounted"
	driveCfg.ErrorMessage = ""
	_ = a.store.SaveDrive(driveCfg)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(driveCfg)
}

func (a *API) HandleUnmountDrive(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/drives/unmount/")
	driveCfg, ok := a.store.GetDrive(id)
	if !ok {
		http.Error(w, "Drive not found", http.StatusNotFound)
		return
	}

	if err := a.supervisor.UnmountDrive(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	driveCfg.Status = "unmounted"
	_ = a.store.SaveDrive(driveCfg)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(driveCfg)
}

func (a *API) HandleRenameDrive(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID          string `json:"id"`
		VolumeLabel string `json:"volumeLabel"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.ID == "" {
		http.Error(w, "Drive ID is required", http.StatusBadRequest)
		return
	}

	driveCfg, ok := a.store.GetDrive(req.ID)
	if !ok {
		http.Error(w, "Drive not found", http.StatusNotFound)
		return
	}

	trimmedLabel := strings.TrimSpace(req.VolumeLabel)
	if trimmedLabel == "" {
		trimmedLabel = driveCfg.AccountName
	}

	wasMounted := a.supervisor.IsMounted(driveCfg.ID)
	if wasMounted {
		_ = a.supervisor.UnmountDrive(driveCfg.ID)
	}

	driveCfg.VolumeLabel = trimmedLabel
	_ = a.store.SaveDrive(driveCfg)

	if wasMounted {
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
	_ = json.NewEncoder(w).Encode(driveCfg)
}

func (a *API) HandleDeleteDrive(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/drives/")
	_ = a.supervisor.UnmountDrive(id)

	if err := a.store.DeleteDrive(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"deleted"}`))
}

func (a *API) HandleOpenExplorer(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/drives/open/")
	driveCfg, ok := a.store.GetDrive(id)
	if !ok {
		http.Error(w, "Drive not found", http.StatusNotFound)
		return
	}

	go func() {
		_ = exec.Command("explorer", driveCfg.DriveLetter+"\\").Start()
	}()

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"opened"}`))
}

func (a *API) HandleInstallWinFsp(w http.ResponseWriter, r *http.Request) {
	go func() {
		_ = a.supervisor.DownloadAndLaunchWinFspInstaller()
	}()

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"downloading_installer"}`))
}

type ShutdownRequest struct {
	WithWinFsp bool `json:"withWinFsp"`
}

func (a *API) HandleShutdown(w http.ResponseWriter, r *http.Request) {
	var req ShutdownRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	// Unmount all mounted drives cleanly
	a.supervisor.UnmountAll()

	if req.WithWinFsp {
		go func() {
			_ = exec.Command("net", "stop", "WinFsp.Launcher").Run()
		}()
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"shutting_down"}`))

	go func() {
		time.Sleep(500 * time.Millisecond)
		os.Exit(0)
	}()
}
