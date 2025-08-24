# =============================
# NoveaOS Build Script - Windows PowerShell Compatible
# =============================

function section {
    param([string]$Message)
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function success {
    param([string]$Message)
    Write-Host "✔ $Message" -ForegroundColor Green
}

function warn {
    param([string]$Message)
    Write-Host "! $Message" -ForegroundColor Yellow
}

function error {
    param([string]$Message)
    Write-Host "✖ $Message" -ForegroundColor Red
}

section "Starting Build..."
section "Building source code"

# Clean old build directories
Remove-Item -Recurse -Force ./build/, ./dist/, ./dist-transport/, ./dist-sw/, ./wisp-client-js/dist/, ./apps/ -ErrorAction SilentlyContinue

# Install dependencies
Push-Location ./wisp-client-js/

if (-not (Test-Path "node_modules")) {
    section "Installing dependencies for wisp-client-js"
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install | Out-Null
    } else {
        warn "pnpm not found, falling back to npm"
        Write-Host "Tip: Run 'npm i -g pnpm' to install pnpm"
        npm install | Out-Null
    }
}

Pop-Location

# Build JS
node ./scripts/build.js | Out-Null

# Move build outputs
New-Item -ItemType Directory -Force ./build/dist/ | Out-Null
Move-Item ./dist/* ./build/dist/
Copy-Item -Recurse ./public/* ./build/

New-Item -ItemType Directory -Force ./build/libs/transport/ | Out-Null
Move-Item ./dist-transport/* ./build/libs/transport/

Move-Item ./dist-sw/xen-sw.js ./build/xen-sw.js

New-Item -ItemType Directory -Force ./build/libs/wisp-client-js/ | Out-Null
Move-Item ./wisp-client-js/dist/* ./build/libs/wisp-client-js/

success 'Built source code (Including transport & wisp-client-js)'

section "Copying node_modules dependencies"

function CopyNm {
    param(
        [string]$In,
        [string]$Out
    )
    New-Item -ItemType Directory -Force "./build/$Out" | Out-Null
    Copy-Item -Recurse "./node_modules/$In/*" "./build/$Out/"
    Get-ChildItem -Path "./build/$Out" -Recurse -Include '*.map' | Remove-Item -Force
}

CopyNm "@titaniumnetwork-dev/ultraviolet/dist" "libs/uv"
CopyNm "@mercuryworkshop/bare-mux/dist" "libs/bare-mux"
CopyNm "libcurl.js" "libs/libcurl-js"
CopyNm "comlink/dist" "libs/comlink"

success "Copied node_modules dependencies"

section "Copying included apps"

New-Item -ItemType Directory -Force ./apps/ | Out-Null

function CopyApp {
    param([string]$app)
    Push-Location "./apps-src/$app"
    Compress-Archive -Path ./* -DestinationPath "../../apps/$app.zip" -CompressionLevel Optimal -Force | Out-Null
    Pop-Location
}

# List of apps
$appList = @(
    "org.nebulaservices.about",
    "org.nebulaservices.settings",
    "org.nebulaservices.texteditor",
    "org.nebulaservices.repostore",
    "org.nebulaservices.files",
    "org.nebulaservices.browser",
    "org.nebulaservices.processmanager",
    "org.nebulaservices.terminal",
    "org.nebulaservices.firewall",
    "xen.runtime",
    "xen.kv"
)

foreach ($app in $appList) {
    CopyApp $app
}

Copy-Item -Recurse ./apps/ ./build/apps/

success "Copied apps and libs"

section "Generating files.json"
node ./scripts/generate.cjs
success "Generated files.json"

section "Generating UUID"
[guid]::NewGuid().ToString() | Set-Content ./build/uuid

# Clean temporary directories
Remove-Item -Recurse -Force ./dist/, ./dist-transport/, ./dist-sw/, ./apps/ -ErrorAction SilentlyContinue

Write-Host ""
success "Build completed successfully!"
