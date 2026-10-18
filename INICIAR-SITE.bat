@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title Meu Site 3D - Servidor local
cd /d "%~dp0"
echo.
echo  MEU SITE 3D - iniciando no localhost
echo  Deixe esta janela aberta enquanto estiver usando o site.
echo.
set "SITE_NODE_EXE=%~dp0runtime\node.exe"
if not exist "%SITE_NODE_EXE%" (
  echo ERRO: runtime\node.exe nao foi encontrado. Mantenha a pasta completa.
  pause
  exit /b 1
)
"%SITE_NODE_EXE%" "%~dp0scripts\launch-local.mjs"
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar. Confira a mensagem acima.
  pause
  exit /b 1
)
endlocal
