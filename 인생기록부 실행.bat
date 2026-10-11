@echo off
chcp 65001 > nul
cd /d "%~dp0"
title 인생기록부
set PORT=8080

where node > nul 2> nul
if errorlevel 1 (
  echo [인생기록부] Node.js가 필요합니다. https://nodejs.org 에서 22 버전 이상을 설치해 주세요.
  pause
  exit /b 1
)
node -e "process.exit(+process.versions.node.split('.')[0] >= 22 ? 0 : 1)"
if errorlevel 1 (
  echo [인생기록부] Node.js 22 버전 이상이 필요합니다. 현재 버전:
  node -v
  pause
  exit /b 1
)

if not exist node_modules (
  echo [인생기록부] 처음 실행이라 필요한 패키지를 설치합니다...
  call npm install
  if errorlevel 1 goto fail
)

echo [인생기록부] 게임을 준비하는 중...
call npx vite build --logLevel warn
if errorlevel 1 goto fail

if not exist .env (
  echo [인생기록부] .env 파일이 없어 생애 소설은 임시 소설로 나옵니다. AI 소설을 쓰려면 .env.example 을 참고하세요.
)

if not defined LIFELOG_NO_BROWSER start "" cmd /c "timeout /t 2 > nul & start http://localhost:%PORT%"
echo [인생기록부] http://localhost:%PORT% 에서 실행 중입니다. 이 창을 닫으면 게임이 꺼집니다.
call npm start --silent
goto end

:fail
echo [인생기록부] 실행 중 오류가 발생했습니다. 위의 메시지를 확인해 주세요.
pause
exit /b 1

:end
