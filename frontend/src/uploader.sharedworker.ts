// Shared/Dedicated Worker script for orchestrating S3 multipart uploads with presigned URLs.

type PresignedPart = { partNumber: number, url: string, expiresAt: number }
type UploadedPart = { ETag: string, PartNumber: number, size: number }

type UploadSession = {
  id: string
  bucket: string
  key: string
  uploadId: string
  size: number
  partSize: number
  createdAt: number
  presignedParts: PresignedPart[]
  filename?: string
}

type OPFSRef = { kind: 'opfs', path: string[] } | { kind: 'blob', blob: Blob }

type StartMsg = { type: 'start-upload', session: UploadSession, ref: OPFSRef }
type ResumeMsg = { type: 'resume-upload', sessionId: string }
type ResumeSessionMsg = { type: 'resume-session', session: UploadSession, ref: OPFSRef }
type PauseMsg = { type: 'pause-upload', sessionId: string }
type CancelMsg = { type: 'cancel-upload', sessionId: string }

type ClientMessage = StartMsg | ResumeMsg | ResumeSessionMsg | PauseMsg | CancelMsg

type Progress = {
  sessionId: string
  filename: string
  bytesUploaded: number
  totalBytes: number
  percent: number
  speedBps: number
  etaSeconds: number | null
  state: 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled'
  lastPartCompleted?: UploadedPart
  error?: string
  startedAt: number
}

// Infer backend origin
const BASE = 'http://localhost:4000'

type UploadState = {
  session: UploadSession
  ref: OPFSRef
  partsCompleted: UploadedPart[]
  nextPart: number
  inFlight: number
  concurrency: number
  paused: boolean
  cancelled: boolean
  startedAt: number
  bytesUploaded: number
  lastTickBytes: number
  lastTickTime: number
  retryCount: Map<number, number>
  maxRetries: number
  lastProgressUpdate?: number
}

const uploads = new Map<string, UploadState>()
const ports: MessagePort[] = []
const MAX_CONCURRENT_UPLOADS = 3
const MAX_PART_CONCURRENCY = 3
const MAX_RETRIES = 3
const DEMO_MODE = true // Enable demo mode with slower uploads
const DEMO_CHUNK_SIZE = 256 * 1024 // 256KB chunks for demo
const DEMO_CHUNK_DELAY = 200 // 200ms delay between chunks

function broadcast(type: string, payload: any) {
  for (const p of ports) {
    try {
      p.postMessage({ type, ...payload })
    } catch (e) {
      // Port might be closed
    }
  }
}

// Handle SharedWorker connection
self.onconnect = (e: MessageEvent) => {
  const port = (e.ports && e.ports[0]) || (self as any)
  ports.push(port)
  port.onmessage = (ev: MessageEvent<ClientMessage>) => {
    onMessage(ev.data)
  }
  port.start?.()
}

// Handle DedicatedWorker messages
;(self as any).onmessage = (ev: MessageEvent<ClientMessage>) => onMessage(ev.data)

async function onMessage(msg: ClientMessage) {
  if (msg.type === 'start-upload' || msg.type === 'resume-session') {
    const { session, ref } = msg
    if (!uploads.has(session.id)) {
      const st: UploadState = {
        session,
        ref,
        partsCompleted: [],
        nextPart: 1,
        inFlight: 0,
        concurrency: MAX_PART_CONCURRENCY,
        paused: msg.type === 'resume-session', // Start paused for resumed sessions
        cancelled: false,
        startedAt: msg.type === 'resume-session' ? session.createdAt : Date.now(),
        bytesUploaded: 0,
        lastTickBytes: 0,
        lastTickTime: Date.now(),
        retryCount: new Map(),
        maxRetries: MAX_RETRIES
      }
      uploads.set(session.id, st)
      
      // Start processing active uploads if not a resumed session
      if (msg.type === 'start-upload') {
        // Immediately send a progress update to transition from 'preparing' to 'uploading'
        const initialProgress = {
          sessionId: st.session.id,
          filename: st.session.filename || 'Unknown',
          bytesUploaded: 0,
          totalBytes: st.session.size,
          percent: 0,
          speedBps: 0,
          etaSeconds: null,
          state: 'uploading' as const,
          startedAt: st.startedAt
        }
        broadcast('upload-progress', { progress: initialProgress })
        processUploads()
      }
    }
  } else if (msg.type === 'pause-upload') {
    const st = uploads.get(msg.sessionId)
    if (st && !st.cancelled) {
      st.paused = true
      // Send pause progress update
      const progressUpdate = {
        sessionId: st.session.id,
        filename: st.session.filename || 'Unknown',
        bytesUploaded: st.bytesUploaded,
        totalBytes: st.session.size,
        percent: (st.bytesUploaded / st.session.size) * 100,
        speedBps: 0,
        etaSeconds: null,
        state: 'paused' as const,
        startedAt: st.startedAt
      }
      broadcast('upload-progress', { progress: progressUpdate })
    }
  } else if (msg.type === 'resume-upload') {
    const st = uploads.get(msg.sessionId)
    if (st && !st.cancelled) {
      st.paused = false
      processUploads()
    }
  } else if (msg.type === 'cancel-upload') {
    const st = uploads.get(msg.sessionId)
    if (st) {
      st.cancelled = true
      st.paused = true
      // Send cancel progress update
      const progressUpdate = {
        sessionId: st.session.id,
        filename: st.session.filename || 'Unknown',
        bytesUploaded: st.bytesUploaded,
        totalBytes: st.session.size,
        percent: (st.bytesUploaded / st.session.size) * 100,
        speedBps: 0,
        etaSeconds: null,
        state: 'cancelled' as const,
        startedAt: st.startedAt
      }
      broadcast('upload-progress', { progress: progressUpdate })
      uploads.delete(msg.sessionId)
    }
  }
}

// Process all active uploads
async function processUploads() {
  const activeUploads = Array.from(uploads.values())
    .filter(st => !st.paused && !st.cancelled)
    .slice(0, MAX_CONCURRENT_UPLOADS)
  
  for (const st of activeUploads) {
    pump(st.session.id)
  }
}

function estimate(st: UploadState): { speedBps: number, etaSeconds: number | null, percent: number } {
  const now = Date.now()
  const dt = (now - st.lastTickTime) / 1000
  const dbytes = st.bytesUploaded - st.lastTickBytes
  let speed = 0
  if (dt > 0.5) { // Update speed every 500ms
    speed = dbytes / dt
    st.lastTickBytes = st.bytesUploaded
    st.lastTickTime = now
  } else {
    // Use previous speed
    speed = st.lastTickBytes > 0 ? (st.lastTickBytes / ((st.lastTickTime - st.startedAt) / 1000)) : 0
  }
  const percent = st.session.size > 0 ? (st.bytesUploaded / st.session.size) * 100 : 0
  const remaining = Math.max(0, st.session.size - st.bytesUploaded)
  const eta = speed > 0 ? remaining / speed : null
  return { speedBps: Math.max(0, speed), etaSeconds: eta, percent: Math.min(100, percent) }
}

async function pump(sessionId: string) {
  const st = uploads.get(sessionId)
  if (!st || st.paused || st.cancelled) return

  const totalParts = Math.ceil(st.session.size / st.session.partSize)

  while (!st.paused && !st.cancelled && st.inFlight < st.concurrency && st.nextPart <= totalParts) {
    const partNumber = st.nextPart++
    st.inFlight++
    
    ;(async () => {
      try {
        const retries = st.retryCount.get(partNumber) || 0
        const url = await getPresignedUrl(st, partNumber)
        const { bytes, size } = await readChunk(st.ref, st.session.partSize, partNumber, st.session.size)
        
        // Upload with demo slowdown if enabled
        const res = await (DEMO_MODE 
          ? throttledUpload(url, bytes, st, size)
          : fetch(url, { 
              method: 'PUT', 
              body: bytes,
              signal: AbortSignal.timeout(60000) // 60s timeout per part
            }))
        
        if (!res.ok) {
          throw new Error(`PUT part ${partNumber} failed: ${res.status}`)
        }
        
        const etag = res.headers.get('ETag') || ''
        st.partsCompleted.push({ ETag: etag.replaceAll('"',''), PartNumber: partNumber, size })
        st.bytesUploaded += size
        st.inFlight--
        st.retryCount.delete(partNumber) // Clear retry count on success
        
        // Update progress with the new part
        const { speedBps, etaSeconds, percent } = estimate(st)
        const progress: Progress = {
          sessionId,
          filename: st.session.filename || 'Unknown',
          bytesUploaded: st.bytesUploaded,
          totalBytes: st.session.size,
          percent,
          speedBps,
          etaSeconds,
          state: 'uploading',
          startedAt: st.startedAt
        }
        broadcast('upload-progress', { progress })

        if (st.partsCompleted.length === totalParts) {
          // Ensure minimum upload time has passed before completing
          const elapsed = Date.now() - st.startedAt
          const minUploadTime = 3000 // 3 seconds minimum
          
          if (elapsed < minUploadTime) {
            // Wait for minimum time, then complete
            setTimeout(async () => {
              await complete(st)
              // Send final completion event
              const finalProgress: Progress = {
                sessionId,
                filename: st.session.filename || 'Unknown',
                bytesUploaded: st.session.size,
                totalBytes: st.session.size,
                percent: 100,
                speedBps: 0,
                etaSeconds: 0,
                state: 'completed',
                startedAt: st.startedAt
              }
              broadcast('upload-complete', { progress: finalProgress })
              uploads.delete(sessionId)
            }, minUploadTime - elapsed)
          } else {
            // Minimum time has passed, complete immediately
            await complete(st)
            // Send final completion event
            const finalProgress: Progress = {
              sessionId,
              filename: st.session.filename || 'Unknown',
              bytesUploaded: st.session.size,
              totalBytes: st.session.size,
              percent: 100,
              speedBps: 0,
              etaSeconds: 0,
              state: 'completed',
              startedAt: st.startedAt
            }
            broadcast('upload-complete', { progress: finalProgress })
            uploads.delete(sessionId)
          }
        } else {
          pump(sessionId)
        }
      } catch (err: any) {
        st.inFlight--
        
        // Handle retries
        const currentRetries = st.retryCount.get(partNumber) || 0
        if (currentRetries < st.maxRetries && !st.cancelled) {
          st.retryCount.set(partNumber, currentRetries + 1)
          st.nextPart = Math.min(st.nextPart, partNumber) // Retry this part
          
          // Exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, currentRetries), 10000)
          setTimeout(() => pump(sessionId), backoffMs)
        } else {
          // Max retries exceeded or cancelled
          progress(sessionId, 'error', undefined, String(err?.message || err))
          st.paused = true
        }
      }
    })()
  }
}

async function getPresignedUrl(st: UploadState, partNumber: number): Promise<string> {
  const found = st.session.presignedParts.find(p => p.partNumber === partNumber && p.expiresAt > Date.now() + 60_000)
  if (found) return found.url
  
  // Request batch of presigned URLs
  const batchSize = 20
  const toSign: number[] = []
  for (let i = partNumber; i < partNumber + batchSize && i <= Math.ceil(st.session.size / st.session.partSize); i++) {
    toSign.push(i)
  }
  
  const res = await fetch(`${BASE}/api/upload-sessions/${st.session.id}/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partNumbers: toSign })
  })
  
  if (!res.ok) throw new Error(`presign failed: ${res.status}`)
  
  const parts: PresignedPart[] = await res.json()
  for (const p of parts) {
    const idx = st.session.presignedParts.findIndex(pp => pp.partNumber === p.partNumber)
    if (idx >= 0) {
      st.session.presignedParts[idx] = p
    } else {
      st.session.presignedParts.push(p)
    }
  }
  
  const got = st.session.presignedParts.find(p => p.partNumber === partNumber)
  if (!got) throw new Error('presign missing requested part')
  return got.url
}

async function complete(st: UploadState) {
  st.partsCompleted.sort((a, b) => a.PartNumber - b.PartNumber)
  
  const res = await fetch(`${BASE}/api/upload-sessions/${st.session.id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parts: st.partsCompleted })
  })
  
  if (!res.ok) throw new Error(`complete failed: ${res.status}`)
}

function progress(sessionId: string, state: Progress['state'], lastPartCompleted?: UploadedPart, error?: string) {
  const st = uploads.get(sessionId)
  if (!st) return
  
  const { speedBps, etaSeconds, percent } = estimate(st)
  const payload: Progress = {
    sessionId,
    filename: st.session.filename || 'Unknown',
    bytesUploaded: st.bytesUploaded,
    totalBytes: st.session.size,
    percent,
    speedBps,
    etaSeconds,
    state,
    lastPartCompleted,
    error,
    startedAt: st.startedAt
  }
  
  broadcast('upload-progress', { progress: payload })
  if (state === 'error') {
    broadcast('upload-error', { error, sessionId })
  }
  if (state === 'completed') {
    broadcast('upload-complete', { progress: payload })
  }
}

// Read a chunk from OPFS or Blob
// Throttled upload for demo mode - simulates slower upload speed
async function throttledUpload(url: string, bytes: ArrayBuffer, st: UploadState, totalSize: number): Promise<Response> {
  // For demo, we'll simulate uploading in chunks with delays
  const chunkSize = DEMO_CHUNK_SIZE
  const totalChunks = Math.ceil(bytes.byteLength / chunkSize)
  let uploadedBytes = 0
  
  // Simulate chunked upload progress
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, bytes.byteLength)
    const chunkBytes = end - start
    
    // Update progress (don't modify st.bytesUploaded here - it will be set by the main function)
    uploadedBytes += chunkBytes
    
    // Broadcast progress updates more frequently for demo
    const now = Date.now()
    if (!st.lastProgressUpdate || now - st.lastProgressUpdate > 200) {
      // Calculate progress based on simulation
      const simulatedBytesUploaded = st.bytesUploaded + uploadedBytes
      const percent = st.session.size > 0 ? (simulatedBytesUploaded / st.session.size) * 100 : 0
      const speed = uploadedBytes / ((now - st.startedAt) / 1000)
      const remaining = Math.max(0, st.session.size - simulatedBytesUploaded)
      const eta = speed > 0 ? remaining / speed : null
      
      const progress = {
        sessionId: st.session.id,
        filename: st.session.filename || 'Unknown',
        bytesUploaded: simulatedBytesUploaded,
        totalBytes: st.session.size,
        percent: Math.min(100, percent),
        speedBps: Math.max(0, speed),
        etaSeconds: eta,
        state: 'uploading',
        startedAt: st.startedAt
      }
      console.log('Broadcasting progress:', progress)
      broadcast('upload-progress', { progress })
      st.lastProgressUpdate = now
    }
    
    // Add delay between chunks (except for last chunk)
    if (i < totalChunks - 1) {
      await new Promise(resolve => setTimeout(resolve, DEMO_CHUNK_DELAY))
    }
  }
  
  // Ensure minimum upload time for demo (at least 3 seconds)
  const elapsed = Date.now() - st.startedAt
  const minUploadTime = 3000 // 3 seconds minimum
  if (elapsed < minUploadTime) {
    await new Promise(resolve => setTimeout(resolve, minUploadTime - elapsed))
  }
  
  // Now do the actual upload
  const response = await fetch(url, { 
    method: 'PUT', 
    body: bytes,
    signal: AbortSignal.timeout(60000)
  })
  
  // If successful, the progress will be updated by the main pump function
  // Don't set bytesUploaded here - let the main function handle it
  return response
}

async function readChunk(ref: OPFSRef, partSize: number, partNumber: number, totalSize: number): Promise<{ bytes: ArrayBuffer, size: number }> {
  const start = (partNumber - 1) * partSize
  const end = Math.min(start + partSize, totalSize)
  const len = end - start
  
  if (ref.kind === 'blob') {
    const slice = ref.blob.slice(start, end)
    return { bytes: await slice.arrayBuffer(), size: len }
  }
  
  const root: any = await (navigator as any).storage.getDirectory()
  let dir = root
  for (let i = 0; i < ref.path.length - 1; i++) {
    dir = await dir.getDirectoryHandle(ref.path[i], { create: false })
  }
  const handle = await dir.getFileHandle(ref.path[ref.path.length - 1], { create: false })
  const file = await handle.getFile()
  const slice = file.slice(start, end)
  return { bytes: await slice.arrayBuffer(), size: len }
}