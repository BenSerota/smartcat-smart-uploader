# Smartcat Resumable Uploader (Web-only, Production-ready Basis)

This starter gives you a **real** resumable uploader that:
- Stages the file in the **Origin Private File System (OPFS)** so the user can safely leave the upload view and resume later without re-selecting the file.
- Uses a **SharedWorker** so uploads keep running while the user navigates around your app (as long as at least one Smartcat tab is open).
- Implements **S3 Multipart Upload** with presigned URLs (backend in Express/TypeScript).
- **Auto-resumes** uploads on re-visit if the last tab was closed.
- Provides a simple React UI and a hook you can drop into your app.

> Limitation (web-only): When the **last** Smartcat tab is closed, the browser halts uploads. We persist state + OPFS copy so we can **resume on next visit** from the last confirmed byte.

## Quick start

### Prereqs
- Node 18+
- An AWS account (or compatible S3) with a bucket. Configure CORS on the bucket to allow `PUT` from your frontend origin.
- Create a `.env` in `/backend` (see `.env.example`).

### 1) Backend (Express + AWS SDK v3)
```bash
cd backend
npm i
cp .env.example .env
# set AWS creds/bucket/region in .env
npm run dev
# server on http://localhost:4000
```

### 2) Frontend (Vite + React + TypeScript)
```bash
cd frontend
npm i
# Tell the frontend where your backend is:
echo 'VITE_API_BASE_URL="http://localhost:4000"' > .env.local
npm run dev
# app on http://localhost:5173
```

Open http://localhost:5173, pick a large file, watch it upload. Try navigating around (route changes). Try closing the tab and re-opening — it will auto-resume.

## S3 Bucket CORS (example)

In S3 console → your bucket → **Permissions → CORS**:
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

## How it works (high level)

- **Frontend**
  - `useUploader` hook exposes `addFile(file)` and progress events.
  - Selected file is **copied to OPFS** under `/uploads/{sessionId}.bin`.
  - A **SharedWorker** runs the upload loop, reading chunks from OPFS and `PUT`-ing to **presigned part URLs**.
  - Progress and part completions are sent back to the page via `MessagePort`. UI updates live.
  - If the last tab closes, the worker stops; on the next visit, the page finds the OPFS file + session manifest and **resumes**.

- **Backend**
  - `POST /api/upload-sessions` → starts S3 multipart upload, returns `uploadSessionId`, `key`, `uploadId`, `partSize`, and a **batch** of presigned part URLs.
  - `POST /api/upload-sessions/:id/parts` → presigns additional part URLs on demand.
  - `POST /api/upload-sessions/:id/complete` → completes multipart upload with the collected `{ETag, PartNumber}` list.
  - In-memory session store for demo. Swap with Redis/DB in production.

## Notes

- Default part size is 8 MiB (S3 min 5 MiB). Tune via `PART_SIZE_BYTES` env var or per-request.
- Integrity: we rely on S3 per-part `ETag` and end-to-end retries. You can add MD5 headers if you also sign them.
- You can add Web Push/email notifications off the backend's `upload_completed` event.
- To support multi-tab uploads, we use a **SharedWorker**; if the environment lacks it, we fallback to a **Dedicated Worker** automatically.

## File tree

```
smartcat-resumable-uploader-starter/
  backend/
    src/
      index.ts
      s3.ts
      sessions.ts
      types.ts
    package.json
    tsconfig.json
    .env.example
  frontend/
    src/
      main.tsx
      App.tsx
      components/Uploader.tsx
      useUploader.ts
      api.ts
      opfs.ts
      uploader.sharedworker.ts
      uploadTypes.ts
    index.html
    package.json
    tsconfig.json
    vite.config.ts
```
