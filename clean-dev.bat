@echo off
echo Cleaning up all development environments...

REM Remove development directory
if exist dev (
  echo Removing development directory...
  rmdir /S /Q dev
)

REM Remove backup directory
if exist backup (
  echo Removing backup directory...
  rmdir /S /Q backup
)

REM Remove build directory
if exist build (
  echo Removing build directory...
  rmdir /S /Q build
)

echo.
echo Development environments cleaned up successfully.
echo. 