import type { UploadProgress } from './uploadTypes'

export interface MockUploadSession {
  id: string
  filename: string
  size: number
  contentType: string
}

export interface MockUploadCallbacks {
  onProgress: (sessionId: string, progress: UploadProgress) => void
  onComplete: (sessionId: string, progress: UploadProgress) => void
  onError: (sessionId: string, error: string) => void
}

class MockUploader {
  private activeUploads = new Map<string, NodeJS.Timeout>()
  private callbacks: MockUploadCallbacks | null = null

  setCallbacks(callbacks: MockUploadCallbacks) {
    this.callbacks = callbacks
  }

  startUpload(session: MockUploadSession) {
    const sessionId = session.id
    const totalBytes = session.size
    let bytesUploaded = 0
    const startTime = Date.now()
    
    // Simulate realistic upload speed (1-5 MB/s)
    const baseSpeed = 2 * 1024 * 1024 // 2 MB/s base
    const speedVariation = 1.5 * 1024 * 1024 // ±1.5 MB/s variation
    const speed = baseSpeed + (Math.random() - 0.5) * speedVariation
    
    const updateProgress = () => {
      if (!this.callbacks) return
      
      const elapsed = (Date.now() - startTime) / 1000
      const targetBytes = Math.min(totalBytes, (speed * elapsed))
      
      // Add some randomness to make it feel more realistic
      const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
      bytesUploaded = Math.min(totalBytes, targetBytes * randomFactor)
      
      const percent = Math.round((bytesUploaded / totalBytes) * 100)
      const currentSpeed = bytesUploaded / elapsed
      const remainingBytes = totalBytes - bytesUploaded
      const etaSeconds = remainingBytes / currentSpeed
      
      const progress: UploadProgress = {
        sessionId,
        filename: session.filename,
        bytesUploaded: Math.round(bytesUploaded),
        totalBytes,
        percent,
        speedBps: currentSpeed,
        etaSeconds: etaSeconds > 0 ? Math.round(etaSeconds) : 0,
        state: 'uploading',
        startedAt: startTime
      }
      
      this.callbacks.onProgress(sessionId, progress)
      
      // Check if upload is complete
      if (bytesUploaded >= totalBytes) {
        this.completeUpload(sessionId, progress)
      }
    }
    
    // Update progress every 200ms
    const interval = setInterval(updateProgress, 200)
    this.activeUploads.set(sessionId, interval)
    
    // Start with preparing state
    setTimeout(() => {
      if (this.callbacks) {
        const preparingProgress: UploadProgress = {
          sessionId,
          filename: session.filename,
          bytesUploaded: 0,
          totalBytes,
          percent: 0,
          speedBps: 0,
          etaSeconds: null,
          state: 'preparing',
          startedAt: startTime
        }
        this.callbacks.onProgress(sessionId, preparingProgress)
      }
    }, 100)
    
    // Start uploading after 1 second
    setTimeout(() => {
      updateProgress()
    }, 1000)
  }
  
  pauseUpload(sessionId: string) {
    const interval = this.activeUploads.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.activeUploads.delete(sessionId)
    }
    
    if (this.callbacks) {
      // Send paused state
      this.callbacks.onProgress(sessionId, {
        sessionId,
        filename: '',
        bytesUploaded: 0,
        totalBytes: 0,
        percent: 0,
        speedBps: 0,
        etaSeconds: null,
        state: 'paused',
        startedAt: Date.now()
      })
    }
  }
  
  resumeUpload(sessionId: string, session: MockUploadSession) {
    // Restart the upload simulation
    this.startUpload(session)
  }
  
  cancelUpload(sessionId: string) {
    const interval = this.activeUploads.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.activeUploads.delete(sessionId)
    }
  }
  
  private completeUpload(sessionId: string, finalProgress: UploadProgress) {
    const interval = this.activeUploads.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.activeUploads.delete(sessionId)
    }
    
    if (this.callbacks) {
      const completedProgress: UploadProgress = {
        ...finalProgress,
        state: 'completed',
        percent: 100,
        speedBps: 0,
        etaSeconds: 0
      }
      
      this.callbacks.onComplete(sessionId, completedProgress)
    }
  }
}

export const mockUploader = new MockUploader()
