# Avoiding Terminal Issues

## The Problem
When using multiple background processes and changing directories, the terminal context gets lost, causing commands to run in the wrong directory.

## The Solution

### 1. Use the Start Script
```bash
./start.sh
```
This script uses absolute paths and manages all services properly.

### 2. Check Services
```bash
lsof -i :5173,4000,9000 | grep LISTEN
```

### 3. Check Logs
```bash
tail -f frontend/frontend.log  # Frontend logs
tail -f backend/backend.log    # Backend logs
tail -f mock-s3/mock-s3.log   # Mock S3 logs
```

### 4. Stop All Services
```bash
kill $(lsof -ti:5173,4000,9000)
```

## Best Practices for Assistants
1. Always use absolute paths in scripts
2. Avoid chaining background processes with directory changes
3. Create single scripts to manage multiple services
4. Log output to files instead of console for background processes
5. Always verify current directory before running commands

## Quick Restart
If something goes wrong:
```bash
# From any directory
cd "/Users/benserota/Documents/Code Projects/smartcat-smart-uploader"
./start.sh
```
