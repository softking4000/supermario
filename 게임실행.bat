@echo off
chcp 65001 > nul
echo ========================================================
echo   슈퍼 검투사 브라더스 (Super Gladiator Bros) 게임 실행
echo   100% 브라우저 순수 기술 (Canvas 2D + Web Audio API)
echo ========================================================
echo.
echo 기본 웹 브라우저로 게임을 즉시 실행합니다...
start "" "%~dp0index.html"
exit
