// Mock uploader that simulates realistic upload progress over 3 minutes
import { useUploadStore } from './uploadStore'

export class MockUploader {
  private uploads = new Map<string, {
    file: File
    startTime: number
    totalBytes: number
    bytesUploaded: number
    speedBps: number
    intervalId: NodeJS.Timeout
  }>()

  startMockUpload(file: File, sessionId: string) {
    const totalBytes = file.size
    const startTime = Date.now()
    const duration = 3 * 60 * 1000 // 3 minutes in milliseconds
    
    // Calculate realistic speed (varies between 1-5 MB/s)
    const baseSpeed = (totalBytes / duration) * (0.8 + Math.random() * 0.4) // ±20% variation
    
    const upload = {
      file,
      startTime,
      totalBytes,
      bytesUploaded: 0,
      speedBps: baseSpeed,
      intervalId: setInterval(() => {
        this.updateProgress(sessionId, totalBytes, startTime, baseSpeed)
      }, 100) // Update every 100ms
    }
    
    this.uploads.set(sessionId, upload)
    
    // Initial progress update
    this.updateProgress(sessionId, totalBytes, startTime, baseSpeed)
  }

  private updateProgress(sessionId: string, totalBytes: number, startTime: number, baseSpeed: number) {
    const elapsed = Date.now() - startTime
    const duration = 3 * 60 * 1000 // 3 minutes
    
    // Use a smooth curve for progress (starts slow, speeds up, then slows down)
    const progress = Math.min(elapsed / duration, 1)
    const smoothProgress = this.smoothProgress(progress)
    
    const bytesUploaded = Math.min(Math.floor(totalBytes * smoothProgress), totalBytes)
    const percent = (bytesUploaded / totalBytes) * 100
    
    // Calculate realistic speed with some variation
    const speedVariation = 0.7 + Math.random() * 0.6 // ±30% variation
    const currentSpeed = baseSpeed * speedVariation
    
    // Calculate ETA
    const remainingBytes = totalBytes - bytesUploaded
    const etaSeconds = remainingBytes > 0 && currentSpeed > 0 ? remainingBytes / currentSpeed : 0
    
    const state = percent >= 100 ? 'completed' : 'uploading'
    
    // Update the upload store
    const { updateProgress } = useUploadStore.getState()
    updateProgress(sessionId, {
      sessionId,
      filename: this.uploads.get(sessionId)?.file.name || 'document.pdf',
      bytesUploaded,
      totalBytes,
      percent,
      speedBps: currentSpeed,
      etaSeconds: etaSeconds > 0 ? etaSeconds : null,
      state: state as any,
      startedAt: startTime
    })
    
    // Clean up when completed
    if (percent >= 100) {
      const upload = this.uploads.get(sessionId)
      if (upload) {
        clearInterval(upload.intervalId)
        this.uploads.delete(sessionId)
      }
    }
  }

  private smoothProgress(progress: number): number {
    // Smooth curve: starts slow, speeds up in middle, slows down at end
    if (progress < 0.1) {
      return progress * progress * 10 // Slow start
    } else if (progress < 0.9) {
      return 0.01 + (progress - 0.1) * 1.25 // Steady middle
    } else {
      const endProgress = (progress - 0.9) * 10
      return 0.91 + endProgress * endProgress * 0.9 // Slow finish
    }
  }

  pauseUpload(sessionId: string) {
    const upload = this.uploads.get(sessionId)
    if (upload) {
      clearInterval(upload.intervalId)
      const { updateProgress } = useUploadStore.getState()
      updateProgress(sessionId, {
        sessionId,
        filename: upload.file.name,
        bytesUploaded: upload.bytesUploaded,
        totalBytes: upload.totalBytes,
        percent: (upload.bytesUploaded / upload.totalBytes) * 100,
        speedBps: 0,
        etaSeconds: null,
        state: 'paused',
        startedAt: upload.startTime
      })
    }
  }

  resumeUpload(sessionId: string) {
    const upload = this.uploads.get(sessionId)
    if (upload) {
      // Restart the interval
      upload.intervalId = setInterval(() => {
        this.updateProgress(sessionId, upload.totalBytes, upload.startTime, upload.speedBps)
      }, 100)
    }
  }

  cancelUpload(sessionId: string) {
    const upload = this.uploads.get(sessionId)
    if (upload) {
      clearInterval(upload.intervalId)
      this.uploads.delete(sessionId)
    }
  }
}

export const mockUploader = new MockUploader()