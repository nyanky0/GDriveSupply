package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type DriveConfig struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	AccountName     string    `json:"accountName"`
	VolumeLabel     string    `json:"volumeLabel,omitempty"` // Custom name displayed in Windows File Explorer
	DriveLetter     string    `json:"driveLetter"` // e.g. "X:"
	RefreshTokenEnc string    `json:"refreshTokenEnc"`
	TotalStorage    int64     `json:"totalStorage"`
	UsedStorage     int64     `json:"usedStorage"`
	Status          string    `json:"status"` // "mounted", "unmounted", "syncing", "error"
	ErrorMessage    string    `json:"errorMessage,omitempty"`
	ConnectedAt     time.Time `json:"connectedAt"`
	LastSynced      time.Time `json:"lastSynced"`
}

type AppConfig struct {
	GoogleClientIDEnc     string                  `json:"googleClientIdEnc"`
	GoogleClientSecretEnc string                  `json:"googleClientSecretEnc"`
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

func (s *Store) save() error {
	data, err := json.MarshalIndent(s.config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, data, 0600)
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
	return s.save()
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
	return s.save()
}

// DeleteDrive removes a drive by ID
func (s *Store) DeleteDrive(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.config.Drives, id)
	return s.save()
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
