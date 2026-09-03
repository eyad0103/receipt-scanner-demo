@echo off
echo Login to GitHub once, then tell opencode "push it".
"%ProgramFiles%\GitHub CLI\gh.exe" auth login 2>nul || gh auth login
pause
