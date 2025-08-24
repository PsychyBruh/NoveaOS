# build.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Section($Message) {
    Write-Host '==> ' + $Message -ForegroundColor Cyan
}

function Success($Message) {
    Write-Host '✔ ' + $Message -ForegroundColor Green
}

function Warn($Message) {
    Write-Host '! ' + $Message -ForegroundColor Yellow
}

function ErrorMsg($Message) {
    Write-Host '✖ ' + $Message -ForegroundColor Red
}

Section 'Starting Build...'
Section 'Building source code'

# Remove previous build artifacts
Remove-Item -Recurse -Force ./build, ./dist, ./dist-transport, ./dist-sw, ./wisp-client-js/dist, ./apps -ErrorAction SilentlyContinue

# Build wisp-client-js
Push-Location ./wisp-client-js

if (-not (Test-Path 'node_modules')) {
    Section 'Installing dependencies for wisp-client-js'

    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install | Out-Null
    }
    else {
        Warn 'pnpm not found, falling back to npm'
        Write-Host 'Tip: Run ''npm i -g pnpm'' to install pnpm'
        npm install | Out-Null
    }
}

Pop-Location

# Run main build script
node ./scripts/build.js | Out-Null

# Move built files
New-Item -ItemType Directory -Force ./build/dist | Out-Null
Move-Item ./dist/* ./build/dist/
Copy-Item -Recurse ./public/* ./build/

New-Item -ItemType Directory -Force ./build/libs/transport | Out-Null
Move-Item ./dist-transport/* ./build/libs/transport/

Move-Item ./dist-sw/novea-sw.js ./build/novea-sw.js

New-Item -ItemType Directory -Force ./build/libs/wisp-client-js | Out-Null
Move-Item ./wisp-client-js/dist/* ./build/libs/wisp-client-js/

Success 'Built source code Including transport and wisp-client-js'
Section 'Copying node_modules dependencies'

function CopyNm($In, $Out) {
    New-Item -ItemType Directory -Force "./build/$Out" | Out-Null
    Copy-Item -Recurse "./node_modules/$In/*" "./build/$Out/"

    Get-ChildItem -Path "./build/$Out" -Recurse -Include '*.map' | Remove-Item -Force
}

CopyNm '@titaniumnetwork-dev/ultraviolet/dist' 'libs/uv'
CopyNm '@mercuryworkshop/bare-mux/dist' 'libs/bare-mux'
CopyNm 'libcurl.js' 'libs/libcurl-js'
CopyNm 'comlink/dist' 'libs/comlink'

Success 'Copied node_modules dependencies'
Section 'Copying included apps'

New-Item -ItemType Directory -Force ./apps | Out-Null

function CopyApp($App) {
    Push-Location "./apps-src/$App"
    Compress-Archive -Path ./* -DestinationPath "../../apps/$App.zip" -CompressionLevel Optimal -Force
    Pop-Location
}

# List of apps
$appList = @(
    'org.nebulaservices.about',
    'org.nebulaservices.settings',
    'org.nebulaservices.texteditor',
    'org.nebulaservices.repostore',
    'org.nebulaservices.files',
    'org.nebulaservices.browser',
    'org.nebulaservices.processmanager',
    'org.nebulaservices.terminal',
    'org.nebulaservices.firewall',
    'novea.runtime',
    'novea.kv'
)

foreach ($app in $appList) {
    CopyApp $app
}

Copy-Item -Recurse ./apps/ ./build/apps/

Success 'Copied apps and libs'
Section 'Generating files.json'
node ./scripts/generate.cjs | Out-Null
Success 'Generated files.json'

Section 'Generating UUID'
[guid]::NewGuid().ToString() | Set-Content ./build/uuid

# Cleanup
Remove-Item -Recurse -Force ./dist, ./dist-transport, ./dist-sw, ./apps -ErrorAction SilentlyContinue

Write-Host ''
Success 'Build completed successfully!'
