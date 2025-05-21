@echo off
echo Cleaning up development environment...

REM First run restore to make sure we have our original files back
call restore-dev.bat

REM Delete the backup directory
if exist backup (
  echo Deleting backup directory...
  rmdir /S /Q backup
)

REM Delete any temporary files that might be left
if exist .fdkignore.bak del .fdkignore.bak
if exist .fdkignore.tmp del .fdkignore.tmp

echo.
echo Development environment cleaned up successfully.
echo. 