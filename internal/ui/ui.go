package ui

import (
	"embed"
	"io/fs"
)

//go:embed all:dist
var distFS embed.FS

// GetFS returns an fs.FS sub-rooted at the dist folder
func GetFS() (fs.FS, error) {
	return fs.Sub(distFS, "dist")
}
