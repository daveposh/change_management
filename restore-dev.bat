@echo off
echo Restoring ES module files...

REM Restore original package.json if backup exists
if exist backup\package.json.bak (
  copy backup\package.json.bak package.json
  echo Original package.json with "type": "module" restored.
) else (
  echo No backup of package.json found.
)

REM Restore original app.js if backup exists
if exist backup\scripts\app.js.bak (
  copy backup\scripts\app.js.bak app\scripts\app.js
  echo Original app.js restored.
) else (
  echo No backup of app.js found.
)

REM Restore index.js if backup exists
if exist backup\scripts\index.js.bak (
  copy backup\scripts\index.js.bak app\scripts\index.js
  echo Original index.js restored.
) else (
  echo No backup of index.js found.
)

REM Restore test-search.js if backup exists
if exist backup\scripts\test-search.js.bak (
  copy backup\scripts\test-search.js.bak app\scripts\test-search.js
  echo Original test-search.js restored.
) else (
  echo No backup of test-search.js found.
)

REM Restore modules folder if backup exists
if exist backup\modules (
  rmdir /S /Q app\scripts\modules
  xcopy /E /I /Y backup\modules app\scripts\modules
  echo Original modules directory restored.
) else (
  echo No backup of modules directory found.
)

REM Restore original script tag in index.html
powershell -Command "$content = Get-Content app\index.html -Raw; $content = $content -replace '<script src=""scripts/app.js""></script>', '<script type=""module"" src=""scripts/app.js""></script>'; Set-Content app\index.html $content"

echo.
echo Development environment restored to original ES module state.
echo You can now continue development with the original files.
echo.

REM Option to clean up backups
set /p delete_backups="Delete backup files? (y/n): "
if /i "%delete_backups%" == "y" (
  rmdir /S /Q backup
  echo Backup files deleted.
) 