@echo off
echo Setting up development environment...

REM Create development directory
if not exist dev mkdir dev
if not exist dev\app\scripts mkdir dev\app\scripts
if not exist dev\app\styles\images mkdir dev\app\styles\images
if not exist dev\config mkdir dev\config

REM Copy main files
copy app\index.html dev\app\
copy app\styles\*.* dev\app\styles\
copy app\scripts\api-utils.js dev\app\scripts\
copy app\scripts\change-form.js dev\app\scripts\
copy manifest.json dev\

REM Copy the development app.js
echo Copying development version of app.js...
copy app\scripts\app-dev.js dev\app\scripts\app.js

REM Create icon file
echo Creating icon file...
echo ^<?xml version="1.0" encoding="UTF-8"?^> > dev\app\styles\images\icon.svg
echo ^<svg width="64px" height="64px" viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"^> >> dev\app\styles\images\icon.svg
echo     ^<title^>Change Management Icon^</title^> >> dev\app\styles\images\icon.svg
echo     ^<g id="Icon" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"^> >> dev\app\styles\images\icon.svg
echo         ^<rect id="Background" fill="#1E88E5" x="0" y="0" width="64" height="64" rx="8"^>^</rect^> >> dev\app\styles\images\icon.svg
echo         ^<path d="M32,16 C40.8366,16 48,23.1634 48,32 C48,40.8366 40.8366,48 32,48 C23.1634,48 16,40.8366 16,32 C16,23.1634 23.1634,16 32,16 Z M32,20 C25.3726,20 20,25.3726 20,32 C20,38.6274 25.3726,44 32,44 C38.6274,44 44,38.6274 44,32 C44,25.3726 38.6274,20 32,20 Z" id="Circle" fill="#FFFFFF" fill-rule="nonzero"^>^</path^> >> dev\app\styles\images\icon.svg
echo         ^<path d="M32,24 C32.5523,24 33,24.4477 33,25 L33,32 L40,32 C40.5523,32 41,32.4477 41,33 C41,33.5523 40.5523,34 40,34 L32,34 C31.4477,34 31,33.5523 31,33 L31,25 C31,24.4477 31.4477,24 32,24 Z" id="Hand" fill="#FFFFFF"^>^</path^> >> dev\app\styles\images\icon.svg
echo     ^</g^> >> dev\app\styles\images\icon.svg
echo ^</svg^> >> dev\app\styles\images\icon.svg

REM Create config directory for iparams if needed
if not exist dev\config\iparams.json (
  echo { > dev\config\iparams.json
  echo   "api_key": { >> dev\config\iparams.json
  echo     "display_name": "API Key", >> dev\config\iparams.json
  echo     "description": "Freshservice API Key", >> dev\config\iparams.json
  echo     "type": "text", >> dev\config\iparams.json
  echo     "required": true, >> dev\config\iparams.json
  echo     "secure": true >> dev\config\iparams.json
  echo   }, >> dev\config\iparams.json
  echo   "domain": { >> dev\config\iparams.json
  echo     "display_name": "Domain", >> dev\config\iparams.json
  echo     "description": "Freshservice Domain", >> dev\config\iparams.json
  echo     "type": "text", >> dev\config\iparams.json
  echo     "required": true >> dev\config\iparams.json
  echo   } >> dev\config\iparams.json
  echo } >> dev\config\iparams.json
)

REM Fix HTML file for development
powershell -Command "(Get-Content dev\app\index.html) -replace '<!-- ES Module versions for modern browsers -->\s*<script type=""module"" src=""scripts/app.js""></script>', '<!-- Development application script -->\n    <script src=""scripts/app.js""></script>' | Set-Content dev\app\index.html"
powershell -Command "(Get-Content dev\app\index.html) -replace '<!-- Legacy non-module version for FDK compatibility -->\s*<script src=""scripts/app-legacy.js""></script>', '' | Set-Content dev\app\index.html"
powershell -Command "(Get-Content dev\app\index.html) -replace '<!-- Fallback for browsers that don''t support ES modules -->\s*<script nomodule>[\s\S]*?</script>', '' | Set-Content dev\app\index.html"

echo Development environment setup complete.
echo Running FDK in development mode...

cd dev && fdk run 