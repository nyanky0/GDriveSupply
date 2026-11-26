//go:build !windows

package config

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
)

var (
	secretKey     []byte
	secretKeyOnce sync.Once
)

func getOrCreateSecretKey() ([]byte, error) {
	var errResult error
	secretKeyOnce.Do(func() {
		cfgDir, err := os.UserConfigDir()
		if err != nil || cfgDir == "" {
			cfgDir = "."
		}
		appDir := filepath.Join(cfgDir, "GDriveSupply")
		_ = os.MkdirAll(appDir, 0700)
		keyFile := filepath.Join(appDir, ".secret.key")

		if data, err := os.ReadFile(keyFile); err == nil && len(data) == 32 {
			secretKey = data
			return
		}

		key := make([]byte, 32)
		if _, err := io.ReadFull(rand.Reader, key); err != nil {
			errResult = fmt.Errorf("failed to generate random secret key: %w", err)
			return
		}

		if err := os.WriteFile(keyFile, key, 0600); err != nil {
			hostname, _ := os.Hostname()
			h := sha256.Sum256([]byte("gdrive-supply-key-" + hostname))
			secretKey = h[:]
			return
		}
		secretKey = key
	})
	if errResult != nil {
		return nil, errResult
	}
	return secretKey, nil
}

// EncryptString encrypts a plaintext string using AES-256-GCM
func EncryptString(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	key, err := getOrCreateSecretKey()
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptString decrypts a Base64 encoded AES-256-GCM ciphertext
func DecryptString(ciphertextBase64 string) (string, error) {
	if ciphertextBase64 == "" {
		return "", nil
	}
	rawEncrypted, err := base64.StdEncoding.DecodeString(ciphertextBase64)
	if err != nil {
		return "", fmt.Errorf("invalid base64: %w", err)
	}
	key, err := getOrCreateSecretKey()
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonceSize := gcm.NonceSize()
	if len(rawEncrypted) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}
	nonce, cipherData := rawEncrypted[:nonceSize], rawEncrypted[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, cipherData, nil)
	if err != nil {
		return "", fmt.Errorf("decryption failed: %w", err)
	}
	return string(plaintext), nil
}
