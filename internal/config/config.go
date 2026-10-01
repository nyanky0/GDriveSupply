package config

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

type DriveConfig struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	AccountName     string    `json:"accountName"`
	VolumeLabel     string    `json:"volumeLabel,omitempty"` // Custom name displayed in Windows File Explorer
	DriveLetter     string    `json:"driveLetter"`           // e.g. "X:"
	RefreshTokenEnc string    `json:"refreshTokenEnc"`
	TotalStorage    int64     `json:"totalStorage"`
	UsedStorage     int64     `json:"usedStorage"`
	Status          string    `json:"status"` // "mounted", "unmounted", "syncing", "error"
	ErrorMessage    string    `json:"errorMessage,omitempty"`
	ConnectedAt     time.Time `json:"connectedAt"`
	LastSynced      time.Time `json:"lastSynced"`
}

type SecurityConfig struct {
	PasswordEnabled  bool   `json:"passwordEnabled"`
	PasswordHash     string `json:"passwordHash,omitempty"`     // bcrypt hash (purged when disabled)
	FailedAttempts   int    `json:"failedAttempts"`             // Max 5 attempts
	SessionTokenHash string `json:"sessionTokenHash,omitempty"` // SHA-256 hash of active session token
}

type AppConfig struct {
	GoogleClientIDEnc     string                  `json:"googleClientIdEnc"`
	GoogleClientSecretEnc string                  `json:"googleClientSecretEnc"`
	Security              SecurityConfig          `json:"security"`
	Drives                map[string]*DriveConfig `json:"drives"`
}

type Store struct {
	mu       sync.RWMutex
	filePath string
	config   AppConfig
}

var (
	globalStore *Store
	once        sync.Once
)

// GetStore returns the singleton configuration store
func GetStore() *Store {
	once.Do(func() {
		// Store config in %APPDATA%\GDriveSupply\config.json
		appData := os.Getenv("APPDATA")
		configDir := filepath.Join(appData, "GDriveSupply")
		if appData == "" {
			configDir = "."
		}
		_ = os.MkdirAll(configDir, 0755)

		configFile := filepath.Join(configDir, "config.json")

		// Seamless migration from legacy GDriveManager if it exists
		if _, err := os.Stat(configFile); os.IsNotExist(err) && appData != "" {
			oldFile := filepath.Join(appData, "GDriveManager", "config.json")
			if oldData, err := os.ReadFile(oldFile); err == nil {
				_ = os.WriteFile(configFile, oldData, 0600)
			}
		}

		store := &Store{
			filePath: configFile,
			config: AppConfig{
				Drives: make(map[string]*DriveConfig),
			},
		}
		_ = store.load()
		globalStore = store
	})
	return globalStore
}

func (s *Store) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			s.config.Drives = make(map[string]*DriveConfig)
			return nil
		}
		return err
	}

	var cfg AppConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return err
	}
	if cfg.Drives == nil {
		cfg.Drives = make(map[string]*DriveConfig)
	}
	s.config = cfg
	return nil
}

func (s *Store) saveLocked() error {
	data, err := json.MarshalIndent(s.config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, data, 0600)
}

func (s *Store) save() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.saveLocked()
}

// SetCredentials saves the encrypted Google OAuth Client ID and Secret
func (s *Store) SetCredentials(clientID, clientSecret string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	encID, err := EncryptString(clientID)
	if err != nil {
		return err
	}
	encSecret, err := EncryptString(clientSecret)
	if err != nil {
		return err
	}

	s.config.GoogleClientIDEnc = encID
	s.config.GoogleClientSecretEnc = encSecret
	return s.saveLocked()
}

// GetCredentials retrieves decrypted Google OAuth Client ID and Secret
func (s *Store) GetCredentials() (clientID, clientSecret string, err error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.config.GoogleClientIDEnc == "" || s.config.GoogleClientSecretEnc == "" {
		return "", "", nil
	}

	clientID, err = DecryptString(s.config.GoogleClientIDEnc)
	if err != nil {
		return "", "", err
	}
	clientSecret, err = DecryptString(s.config.GoogleClientSecretEnc)
	if err != nil {
		return "", "", err
	}
	return clientID, clientSecret, nil
}

// SaveDrive adds or updates a drive config
func (s *Store) SaveDrive(drive *DriveConfig) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.config.Drives[drive.ID] = drive
	return s.saveLocked()
}

// DeleteDrive removes a drive by ID
func (s *Store) DeleteDrive(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.config.Drives, id)
	return s.saveLocked()
}

// GetDrive retrieves a copy of drive config by ID
func (s *Store) GetDrive(id string) (*DriveConfig, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	d, ok := s.config.Drives[id]
	if !ok {
		return nil, false
	}
	copy := *d
	return &copy, true
}

// GetAllDrives retrieves all drives
func (s *Store) GetAllDrives() []*DriveConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*DriveConfig, 0, len(s.config.Drives))
	for _, d := range s.config.Drives {
		copy := *d
		list = append(list, &copy)
	}
	return list
}

// ==========================================
// MASTER PASSWORD & SECURITY MANAGEMENT
// ==========================================

// ValidatePasswordComplexity enforces uppercase, lowercase, number, symbol, min 8 chars
func ValidatePasswordComplexity(pwd string) error {
	if len(pwd) < 8 {
		return fmt.Errorf("password minimal harus 8 karakter")
	}
	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, c := range pwd {
		switch {
		case unicode.IsUpper(c):
			hasUpper = true
		case unicode.IsLower(c):
			hasLower = true
		case unicode.IsDigit(c):
			hasDigit = true
		case unicode.IsPunct(c) || unicode.IsSymbol(c):
			hasSpecial = true
		}
	}
	if !hasUpper {
		return fmt.Errorf("password harus mengandung huruf besar (A-Z)")
	}
	if !hasLower {
		return fmt.Errorf("password harus mengandung huruf kecil (a-z)")
	}
	if !hasDigit {
		return fmt.Errorf("password harus mengandung angka (0-9)")
	}
	if !hasSpecial {
		return fmt.Errorf("password harus mengandung simbol khusus (@, #, $, dll)")
	}
	return nil
}

func generateSessionToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// GetSecurityStatus returns current security posture
func (s *Store) GetSecurityStatus(sessionToken string) (enabled bool, configured bool, authenticated bool, failedAttempts int) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	enabled = s.config.Security.PasswordEnabled
	configured = s.config.Security.PasswordHash != ""
	if !enabled {
		authenticated = true
	} else {
		authenticated = sessionToken != "" && hashToken(sessionToken) == s.config.Security.SessionTokenHash
	}
	failedAttempts = s.config.Security.FailedAttempts
	return
}

// SetMasterPassword configures or re-enables master password protection
func (s *Store) SetMasterPassword(password string) (string, error) {
	if err := ValidatePasswordComplexity(password); err != nil {
		return "", err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", fmt.Errorf("gagal hash password: %w", err)
	}

	sessionToken, err := generateSessionToken()
	if err != nil {
		return "", err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.config.Security.PasswordEnabled = true
	s.config.Security.PasswordHash = string(hash)
	s.config.Security.FailedAttempts = 0
	s.config.Security.SessionTokenHash = hashToken(sessionToken)

	if err := s.saveLocked(); err != nil {
		return "", err
	}
	return sessionToken, nil
}

// DisablePassword turns off password protection and PURGES the hash from storage
func (s *Store) DisablePassword() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.config.Security.PasswordEnabled = false
	s.config.Security.PasswordHash = "" // Completely purged! No encrypted/hashed password stored
	s.config.Security.FailedAttempts = 0
	s.config.Security.SessionTokenHash = ""

	return s.saveLocked()
}

// VerifyMasterPassword checks master password and tracks failed attempts
// Returns (authenticated, sessionToken, failedAttempts, factoryReset, error)
func (s *Store) VerifyMasterPassword(password string) (bool, string, int, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.config.Security.PasswordEnabled {
		return true, "", 0, false, nil
	}

	err := bcrypt.CompareHashAndPassword([]byte(s.config.Security.PasswordHash), []byte(password))
	if err != nil {
		s.config.Security.FailedAttempts++
		_ = s.saveLocked()

		if s.config.Security.FailedAttempts >= 5 {
			// Trigger factory wipe!
			s.factoryResetLocked()
			return false, "", 5, true, nil
		}

		return false, "", s.config.Security.FailedAttempts, false, nil
	}

	// Correct password -> reset failure counter
	s.config.Security.FailedAttempts = 0
	sessionToken, _ := generateSessionToken()
	s.config.Security.SessionTokenHash = hashToken(sessionToken)
	_ = s.saveLocked()

	return true, sessionToken, 0, false, nil
}

// ChangeMasterPassword updates master password with old password verification
func (s *Store) ChangeMasterPassword(oldPassword, newPassword string) (string, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.config.Security.PasswordEnabled {
		return "", false, fmt.Errorf("proteksi password belum aktif")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(s.config.Security.PasswordHash), []byte(oldPassword)); err != nil {
		s.config.Security.FailedAttempts++
		_ = s.saveLocked()
		if s.config.Security.FailedAttempts >= 5 {
			s.factoryResetLocked()
			return "", true, fmt.Errorf("5 kali salah password berturut-turut: aplikasi di-reset ke kondisi awal")
		}
		return "", false, fmt.Errorf("password lama salah (%d/5)", s.config.Security.FailedAttempts)
	}

	if err := ValidatePasswordComplexity(newPassword); err != nil {
		return "", false, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return "", false, err
	}

	sessionToken, _ := generateSessionToken()
	s.config.Security.PasswordHash = string(hash)
	s.config.Security.FailedAttempts = 0
	s.config.Security.SessionTokenHash = hashToken(sessionToken)

	if err := s.saveLocked(); err != nil {
		return "", false, err
	}
	return sessionToken, false, nil
}

// InvalidateSession logs out current user
func (s *Store) InvalidateSession() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.config.Security.SessionTokenHash = ""
	return s.saveLocked()
}

// FactoryReset erases all configuration and resets to clean state
func (s *Store) FactoryReset() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.factoryResetLocked()
}

func (s *Store) factoryResetLocked() {
	_ = os.Remove(s.filePath)
	s.config = AppConfig{
		GoogleClientIDEnc:     "",
		GoogleClientSecretEnc: "",
		Security: SecurityConfig{
			PasswordEnabled: false,
			FailedAttempts:  0,
		},
		Drives: make(map[string]*DriveConfig),
	}
	_ = s.saveLocked()
}
