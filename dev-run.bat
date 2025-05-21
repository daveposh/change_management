@echo off
echo Setting up development environment...

REM Create development directory
if not exist dev mkdir dev
if not exist dev\app\scripts mkdir dev\app\scripts
if not exist dev\app\styles mkdir dev\app\styles
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