#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "========================================="
echo "  Building GDrive Supply (Linux Native)  "
echo "========================================="

# 1. Build Frontend if requested and npm is available
if [ "$1" == "--build-frontend" ] && command -v npm >/dev/null 2>&1; then
    echo -e "\n[1/2] Building Vite + React Frontend..."
    cd "$PROJECT_ROOT/web"
    npm install
    npm run build
    
    UI_DIST="$PROJECT_ROOT/internal/ui/dist"
    rm -rf "$UI_DIST"
    mkdir -p "$UI_DIST"
    cp -r "$PROJECT_ROOT/web/dist/"* "$UI_DIST/"
else
    echo -e "\n[1/2] Menggunakan embedded frontend UI bawaan (internal/ui/dist)..."
fi

# 2. Build Golang Single Binary
echo -e "\n[2/2] Compiling Golang Single Binary..."
cd "$PROJECT_ROOT"
go mod tidy
go build -ldflags="-s -w" -o "GDriveSupply" ./cmd/app

echo -e "\nSUCCESS: GDriveSupply binary created at $PROJECT_ROOT/GDriveSupply"
