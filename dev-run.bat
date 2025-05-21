@echo off
echo Creating development environment for FDK run...

REM Create backup directory outside the app directory
if not exist backup mkdir backup
if not exist backup\scripts mkdir backup\scripts
if not exist backup\modules mkdir backup\modules

REM Backup package.json
if exist package.json (
  copy package.json backup\package.json.bak
  copy dev-package.json package.json
  echo Switched to development package.json (without "type": "module")
)

REM Backup all module files
if exist app\scripts\app.js (
  copy app\scripts\app.js backup\scripts\app.js.bak
)
if exist app\scripts\index.js (
  copy app\scripts\index.js backup\scripts\index.js.bak
)
if exist app\scripts\test-search.js (
  copy app\scripts\test-search.js backup\scripts\test-search.js.bak
)

REM Backup module folder - move it completely outside app directory
if exist app\scripts\modules (
  xcopy /E /I /Y app\scripts\modules backup\modules
  REM Remove the original modules directory
  rmdir /S /Q app\scripts\modules
)

REM Create non-module temporary files
echo console.log('Legacy mode for development - index.js'); > app\scripts\index.js
echo console.log('Legacy mode for development - test-search.js'); > app\scripts\test-search.js

REM Create empty module directory with placeholder files
mkdir app\scripts\modules
echo // Placeholder for api-client.js > app\scripts\modules\api-client.js
echo // Placeholder for config-manager.js > app\scripts\modules\config-manager.js
echo // Placeholder for ui-manager.js > app\scripts\modules\ui-manager.js
echo // Placeholder for user-search.js > app\scripts\modules\user-search.js

REM Copy the full implementation development version to app.js
copy app\scripts\app-dev.js app\scripts\app.js
echo console.log('Development mode enabled with mock data'); >> app\scripts\app.js

REM Update index.html for development
powershell -Command "$content = Get-Content app\index.html -Raw; $content = $content -replace '<script type=""module"" src=""scripts/app.js""></script>', '<script src=""scripts/app.js""></script>'; Set-Content app\index.html $content"

echo Development environment ready!
echo Starting FDK development server...
echo.
echo IMPORTANT: Type 'npm run restore' after you're done to restore your ES module files!
echo.

fdk run

REM This part won't execute until fdk run is stopped with Ctrl+C
echo Development session ended. Remember to run 'npm run restore' to restore your ES module files. 