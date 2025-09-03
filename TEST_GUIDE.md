# Testing Guide for Smartcat Resumable Uploader

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your AWS credentials:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_REGION`: Your AWS region (e.g., us-east-1)
   - `S3_BUCKET`: Your S3 bucket name
   - `S3_KEY_PREFIX`: Prefix for uploaded files (default: smartcat/uploads)

4. Configure S3 bucket CORS (in AWS Console):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "GET", "POST", "HEAD"],
       "AllowedOrigins": ["http://localhost:5173"],
       "ExposeHeaders": ["ETag","x-amz-checksum-sha256","x-amz-version-id"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will run on http://localhost:4000

### Frontend Setup
1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Create `.env.local` file:
   ```bash
   echo 'VITE_API_BASE_URL="http://localhost:4000"' > .env.local
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:5173

## Testing Scenarios

### 1. Basic Upload
- Open http://localhost:5173
- Drag and drop a file or click "Browse Files"
- Verify upload progress is shown
- Check that speed and ETA are calculated

### 2. Multiple Concurrent Uploads
- Select multiple files at once (or drag multiple files)
- Verify all uploads start and progress simultaneously
- Check that up to 3 uploads run concurrently
- Pause/resume individual uploads

### 3. Drag and Drop
- Drag files over the drop zone
- Verify the zone highlights when dragging
- Drop files and verify upload starts

### 4. Pause/Resume
- Start an upload
- Click "Pause" - verify upload pauses
- Click "Resume" - verify upload continues from where it left off
- Check that progress is maintained

### 5. Browser Tab Close/Reopen
- Start a large file upload
- Close the browser tab while uploading
- Reopen the app in a new tab
- Verify the upload appears in paused state
- Click "Resume" to continue the upload

### 6. Multiple Tabs
- Open the app in multiple tabs
- Start uploads in one tab
- Verify progress updates in all tabs
- Navigate between tabs - uploads should continue

### 7. Error Handling
- Try uploading with invalid AWS credentials
- Disconnect network during upload
- Verify error messages appear as toasts
- Check retry mechanism works (up to 3 retries)

### 8. Toast Notifications
- Complete an upload - success toast should appear
- Cancel an upload - info toast should appear
- Cause an error - error toast should appear

### 9. Upload Completion
- Let uploads complete fully
- Verify completion state
- Click "Remove" to clear completed uploads

### 10. Large File Handling
- Upload a file > 100MB
- Verify multipart upload works correctly
- Check memory usage remains reasonable

## Performance Targets
- Concurrent uploads: Up to 3 files simultaneously
- Part size: 8MB chunks
- Retry attempts: 3 per failed part
- Session persistence: 7 days
- Auto-resume: Within 100ms of page load

## Known Limitations
- Uploads stop when ALL browser tabs are closed
- Web Push notifications not implemented (only in-app toasts)
- File size limited by available browser storage for OPFS

## Troubleshooting

### "CORS error" 
- Check S3 bucket CORS configuration
- Verify backend is running on correct port

### "Presign failed"
- Check AWS credentials in backend .env
- Verify S3 bucket exists and is accessible

### "Upload not resuming"
- Check browser console for errors
- Verify OPFS is supported in your browser
- Try clearing browser storage and re-uploading
