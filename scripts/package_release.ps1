$ErrorActionPreference = "Stop"

$TAG = "v0.8.0"

# 1. Download WebView2 bootstrapper if missing
if (-not (Test-Path "MicrosoftEdgeWebview2Setup.exe")) {
    Write-Host "Downloading Microsoft Edge WebView2 Evergreen Bootstrapper..."
    Invoke-WebRequest -Uri "https://go.microsoft.com/fwlink/p/?LinkId=2124703" -OutFile "MicrosoftEdgeWebview2Setup.exe"
}

# 2. Prepare Portable Directory
$PORTABLE_DIR = "mimir-portable"
if (Test-Path $PORTABLE_DIR) {
    Remove-Item -Recurse -Force $PORTABLE_DIR
}
New-Item -ItemType Directory -Path $PORTABLE_DIR -Force | Out-Null

Write-Host "Copying binaries and assets to $PORTABLE_DIR..."
Copy-Item -Path "src-rust/target/release/mimir-core.exe" -Destination "$PORTABLE_DIR/mimir.exe" -Force
Copy-Item -Path "dist" -Destination "$PORTABLE_DIR/dist" -Recurse -Force
Copy-Item -Path "MicrosoftEdgeWebview2Setup.exe" -Destination "$PORTABLE_DIR/" -Force
Copy-Item -Path "mimir.ico" -Destination "$PORTABLE_DIR/" -Force
Copy-Item -Path "LICENSE" -Destination "$PORTABLE_DIR/" -Force
Copy-Item -Path "README.md" -Destination "$PORTABLE_DIR/" -Force

# 3. Create Portable Zip
$PORTABLE_ZIP = "mimir-$TAG-windows-x64-portable.zip"
if (Test-Path $PORTABLE_ZIP) {
    Remove-Item -Force $PORTABLE_ZIP
}
Write-Host "Compressing $PORTABLE_ZIP..."
Compress-Archive -Path "$PORTABLE_DIR/*" -DestinationPath $PORTABLE_ZIP -Force
$zipSize = (Get-Item $PORTABLE_ZIP).Length
Write-Host "Created $PORTABLE_ZIP ($([math]::Round($zipSize / 1MB, 2)) MB)"

# 4. Copy to installer payload
Copy-Item -Path $PORTABLE_ZIP -Destination "src-rust/payload.zip" -Force
Write-Host "Copied to src-rust/payload.zip"
