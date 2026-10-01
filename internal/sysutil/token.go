package sysutil

import (
	"crypto/rand"
	"encoding/hex"
)

// GenerateRandomToken generates a cryptographically secure random hex string
func GenerateRandomToken(bytes int) string {
	b := make([]byte, bytes)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
