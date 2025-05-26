@echo off
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/src/config/config.env" --prune-empty --tag-name-filter cat -- --all
pause 