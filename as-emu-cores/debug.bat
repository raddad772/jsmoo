npm run asbuild:debug
del build\debug_stable.js
powershell -Command "(gc build\debug.js) -replace 'export ', '' | Out-File -encoding ASCII build\debug_stable.js"
