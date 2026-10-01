package config

import (
	"encoding/base64"
	"fmt"
	"syscall"
	"unsafe"
)

var (
	modcrypt32             = syscall.NewLazyDLL("crypt32.dll")
	procCryptProtectData   = modcrypt32.NewProc("CryptProtectData")
	procCryptUnprotectData = modcrypt32.NewProc("CryptUnprotectData")
)

type dataBlob struct {
	cbData uint32
	pbData *byte
}

func newBlob(d []byte) *dataBlob {
	if len(d) == 0 {
		return &dataBlob{}
	}
	return &dataBlob{
		cbData: uint32(len(d)),
		pbData: &d[0],
	}
}

func (b *dataBlob) toByteArray() []byte {
	if b.cbData == 0 {
		return nil
	}
	d := make([]byte, b.cbData)
	copy(d, unsafe.Slice(b.pbData, b.cbData))
	return d
}

// EncryptString encrypts a plaintext string using Windows DPAPI and returns Base64 encoded string
func EncryptString(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	inBlob := newBlob([]byte(plaintext))
	var outBlob dataBlob

	r, _, err := procCryptProtectData.Call(
		uintptr(unsafe.Pointer(inBlob)),
		0,
		0,
		0,
		0,
		0,
		uintptr(unsafe.Pointer(&outBlob)),
	)
	if r == 0 {
		return "", fmt.Errorf("CryptProtectData failed: %w", err)
	}
	defer syscall.LocalFree(syscall.Handle(unsafe.Pointer(outBlob.pbData)))

	encryptedBytes := outBlob.toByteArray()
	return base64.StdEncoding.EncodeToString(encryptedBytes), nil
}

// DecryptString decrypts a Base64 encoded DPAPI ciphertext and returns the plaintext string
func DecryptString(ciphertextBase64 string) (string, error) {
	if ciphertextBase64 == "" {
		return "", nil
	}
	rawEncrypted, err := base64.StdEncoding.DecodeString(ciphertextBase64)
	if err != nil {
		return "", fmt.Errorf("invalid base64: %w", err)
	}

	inBlob := newBlob(rawEncrypted)
	var outBlob dataBlob

	r, _, err := procCryptUnprotectData.Call(
		uintptr(unsafe.Pointer(inBlob)),
		0,
		0,
		0,
		0,
		0,
		uintptr(unsafe.Pointer(&outBlob)),
	)
	if r == 0 {
		return "", fmt.Errorf("CryptUnprotectData failed: %w", err)
	}
	defer syscall.LocalFree(syscall.Handle(unsafe.Pointer(outBlob.pbData)))

	return string(outBlob.toByteArray()), nil
}
