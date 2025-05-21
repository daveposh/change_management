@echo off
echo Building FDK-compatible validation directory...

REM Create build directories
if not exist build\app\scripts mkdir build\app\scripts
if not exist build\app\styles\images mkdir build\app\styles\images
if not exist build\config mkdir build\config

REM Copy files
copy app\index.html build\app\
copy app\scripts\api-utils.js build\app\scripts\
copy app\scripts\change-form.js build\app\scripts\
copy app\styles\style.css build\app\styles\
copy manifest.json build\

REM Copy the non-module version of app.js
copy app\scripts\app-legacy.js build\app\scripts\app.js

REM Create config file if it doesn't exist
if not exist build\config\iparams.json (
  echo { > build\config\iparams.json
  echo   "api_key": { >> build\config\iparams.json
  echo     "display_name": "API Key", >> build\config\iparams.json
  echo     "description": "Freshservice API Key", >> build\config\iparams.json
  echo     "type": "text", >> build\config\iparams.json
  echo     "required": true, >> build\config\iparams.json
  echo     "secure": true >> build\config\iparams.json
  echo   }, >> build\config\iparams.json
  echo   "domain": { >> build\config\iparams.json
  echo     "display_name": "Domain", >> build\config\iparams.json
  echo     "description": "Freshservice Domain", >> build\config\iparams.json
  echo     "type": "text", >> build\config\iparams.json
  echo     "required": true >> build\config\iparams.json
  echo   } >> build\config\iparams.json
  echo } >> build\config\iparams.json
)

REM Create icon file if it doesn't exist
if not exist build\app\styles\images\icon.svg (
  echo ^<?xml version="1.0" encoding="UTF-8"?^> > build\app\styles\images\icon.svg
  echo ^<svg width="64px" height="64px" viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"^> >> build\app\styles\images\icon.svg
  echo     ^<title^>Change Management Icon^</title^> >> build\app\styles\images\icon.svg
  echo     ^<g id="Icon" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"^> >> build\app\styles\images\icon.svg
  echo         ^<rect id="Background" fill="#1E88E5" x="0" y="0" width="64" height="64" rx="8"^>^</rect^> >> build\app\styles\images\icon.svg
  echo         ^<path d="M32,16 C40.8366,16 48,23.1634 48,32 C48,40.8366 40.8366,48 32,48 C23.1634,48 16,40.8366 16,32 C16,23.1634 23.1634,16 32,16 Z M32,20 C25.3726,20 20,25.3726 20,32 C20,38.6274 25.3726,44 32,44 C38.6274,44 44,38.6274 44,32 C44,25.3726 38.6274,20 32,20 Z" id="Circle" fill="#FFFFFF" fill-rule="nonzero"^>^</path^> >> build\app\styles\images\icon.svg
  echo         ^<path d="M32,24 C32.5523,24 33,24.4477 33,25 L33,32 L40,32 C40.5523,32 41,32.4477 41,33 C41,33.5523 40.5523,34 40,34 L32,34 C31.4477,34 31,33.5523 31,33 L31,25 C31,24.4477 31.4477,24 32,24 Z" id="Hand" fill="#FFFFFF"^>^</path^> >> build\app\styles\images\icon.svg
  echo     ^</g^> >> build\app\styles\images\icon.svg
  echo ^</svg^> >> build\app\styles\images\icon.svg
)

REM Fix module-related HTML
powershell -Command "(Get-Content build\app\index.html) -replace '<!-- ES Module versions for modern browsers -->\s*<script type=""module"" src=""scripts/app.js""></script>', '<!-- Main application script (non-module version) -->\n    <script src=""scripts/app.js""></script>' | Set-Content build\app\index.html"
powershell -Command "(Get-Content build\app\index.html) -replace '<!-- Legacy non-module version for FDK compatibility -->\s*<script src=""scripts/app-legacy.js""></script>', '' | Set-Content build\app\index.html"
powershell -Command "(Get-Content build\app\index.html) -replace '<!-- Fallback for browsers that don''t support ES modules -->\s*<script nomodule>[\s\S]*?</script>', '' | Set-Content build\app\index.html"

REM Update manifest.json with app name and author info
powershell -Command "$manifest = Get-Content build\manifest.json -Raw | ConvertFrom-Json; if (-not $manifest.app_name) { $manifest | Add-Member -Type NoteProperty -Name 'app_name' -Value 'Change Management Tool'; $manifest | Add-Member -Type NoteProperty -Name 'app_version' -Value '1.0.0'; $manifest | Add-Member -Type NoteProperty -Name 'author' -Value @{ name = 'Your Company'; email = 'support@example.com'; url = 'https://www.example.com' }; $manifest | ConvertTo-Json -Depth 10 | Set-Content build\manifest.json }"

echo Build complete. Running FDK validation...
cd build && fdk validate
if %ERRORLEVEL% NEQ 0 (
  cd ..
  echo.
  echo Validation failed! Please fix the issues before packing.
  echo.
  exit /b 1
)

echo.
echo Validation successful. Packing the app...
fdk pack -s
if %ERRORLEVEL% NEQ 0 (
  cd ..
  echo.
  echo Packing failed!
  echo.
  exit /b 1
)

cd ..

echo.
echo Process completed successfully!
echo App package is available at: build\dist\build.zip
echo.
echo Note: Warnings about complexity and race conditions can be ignored for development purposes.
echo If submitting to the Freshworks Marketplace, you should fix these issues and add proper test coverage.
echo. 