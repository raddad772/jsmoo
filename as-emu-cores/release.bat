npm run asbuild:release
del build\release_stable.js
powershell -Command "(gc build\release.js) -replace 'export ', '' | Out-File -encoding ASCII build\release_stable.js"
